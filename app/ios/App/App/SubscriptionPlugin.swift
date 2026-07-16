import Foundation
import Capacitor
import StoreKit

@objc(SubscriptionPlugin)
public class SubscriptionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SubscriptionPlugin"
    public let jsName = "Subscription"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "diagnoseProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getEntitlement", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manageSubscriptions", returnType: CAPPluginReturnPromise)
    ]

    private var transactionUpdatesTask: Task<Void, Never>?

    public override func load() {
        super.load()
        startTransactionUpdates()
    }

    deinit {
        transactionUpdatesTask?.cancel()
    }

    @objc func getProducts(_ call: CAPPluginCall) {
        let productIds = call.getArray("productIds", String.self) ?? []
        if productIds.isEmpty {
            call.resolve(["products": []])
            return
        }

        Task {
            do {
                let products = try await Product.products(for: productIds)
                let orderMap = Dictionary(uniqueKeysWithValues: productIds.enumerated().map { ($0.element, $0.offset) })
                let sortedProducts = products.sorted {
                    (orderMap[$0.id] ?? Int.max) < (orderMap[$1.id] ?? Int.max)
                }
                var response: [String: Any] = [
                    "products": sortedProducts.map(Self.serializeProduct)
                ]

#if SCRAPPY_KIN_QA
                var diagnostics = Self.baseProductDiagnostics(productIds: productIds)
                diagnostics["productLoadCompleted"] = true
                diagnostics["returnedProductCount"] = sortedProducts.count
                diagnostics["returnedProductIds"] = sortedProducts.map(\.id)
                response["diagnostics"] = diagnostics
#endif

                call.resolve(response)
            } catch {
                call.reject(error.localizedDescription, "PRODUCT_LOAD_FAILED")
            }
        }
    }

    @objc func diagnoseProducts(_ call: CAPPluginCall) {
#if SCRAPPY_KIN_QA
        let productIds = call.getArray("productIds", String.self) ?? []
        Task {
            var diagnostics = Self.baseProductDiagnostics(productIds: productIds)

            do {
                let products = try await Product.products(for: productIds)
                diagnostics["productLoadCompleted"] = true
                diagnostics["returnedProductCount"] = products.count
                diagnostics["returnedProductIds"] = products.map(\.id)
                diagnostics["productDisplayPrices"] = products.map { "\($0.id):\($0.displayPrice)" }
            } catch {
                let nsError = error as NSError
                diagnostics["productLoadCompleted"] = false
                diagnostics["productLoadErrorDomain"] = nsError.domain
                diagnostics["productLoadErrorCode"] = nsError.code
                diagnostics["productLoadErrorMessage"] = error.localizedDescription
            }

            let activeProductIds = await currentSubscriptionProductIds(productIds: productIds)
            diagnostics["entitlementLookupCompleted"] = true
            diagnostics["activeProductIds"] = activeProductIds
            diagnostics["subscriptionStatusStates"] = await currentSubscriptionStatusStates(productIds: productIds)

            call.resolve(["diagnostics": diagnostics])
        }
#else
        call.reject("StoreKit diagnostics are unavailable in this build.", "DIAGNOSTICS_UNAVAILABLE")
#endif
    }

    @objc func getEntitlement(_ call: CAPPluginCall) {
        let productIds = call.getArray("productIds", String.self) ?? []

        Task {
            let lookup = await currentSubscriptionLookup(productIds: productIds)
            call.resolve([
                "activeProductIds": lookup.activeProductIds,
                "subscriptionStatuses": lookup.subscriptionStatuses
            ])
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId"), !productId.isEmpty else {
            call.reject("Missing productId.", "INVALID_PRODUCT")
            return
        }

        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("Subscription product could not be found.", "PRODUCT_NOT_FOUND")
                    return
                }

                let result = try await product.purchase()
                switch result {
                case .success(let verificationResult):
                    switch verificationResult {
                    case .verified(let transaction):
                        await transaction.finish()
                        let lookup = await currentSubscriptionLookup(productIds: [productId])
                        call.resolve([
                            "status": "purchased",
                            "activeProductIds": lookup.activeProductIds,
                            "subscriptionStatuses": lookup.subscriptionStatuses
                        ])
                    case .unverified(_, let error):
                        call.reject(error.localizedDescription, "UNVERIFIED_TRANSACTION")
                    }
                case .userCancelled:
                    call.resolve([
                        "status": "cancelled",
                        "activeProductIds": []
                    ])
                case .pending:
                    call.resolve([
                        "status": "pending",
                        "activeProductIds": []
                    ])
                @unknown default:
                    call.reject("Purchase returned an unknown result.", "UNKNOWN_PURCHASE_RESULT")
                }
            } catch {
                call.reject(error.localizedDescription, "PURCHASE_FAILED")
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        let productIds = call.getArray("productIds", String.self) ?? []

        Task {
            do {
                try await AppStore.sync()
                let lookup = await currentSubscriptionLookup(productIds: productIds)
                call.resolve([
                    "activeProductIds": lookup.activeProductIds,
                    "subscriptionStatuses": lookup.subscriptionStatuses
                ])
            } catch {
                let lookup = await currentSubscriptionLookup(productIds: productIds)
                if !lookup.activeProductIds.isEmpty {
                    call.resolve([
                        "activeProductIds": lookup.activeProductIds,
                        "subscriptionStatuses": lookup.subscriptionStatuses
                    ])
                    return
                }

                call.reject(error.localizedDescription, "RESTORE_FAILED")
            }
        }
    }

    @objc func manageSubscriptions(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard let windowScene = self.bridge?.viewController?.view.window?.windowScene else {
                call.reject("Subscription management is unavailable right now.", "MANAGE_SUBSCRIPTIONS_UNAVAILABLE")
                return
            }

            do {
                try await AppStore.showManageSubscriptions(in: windowScene)
                call.resolve()
            } catch {
                call.reject(error.localizedDescription, "MANAGE_SUBSCRIPTIONS_FAILED")
            }
        }
    }

    private func startTransactionUpdates() {
        transactionUpdatesTask?.cancel()
        transactionUpdatesTask = Task { [weak self] in
            guard let self else { return }

            for await result in Transaction.updates {
                var updatedProductIds: [String] = []

                if case .verified(let transaction) = result {
                    updatedProductIds = [transaction.productID]
                    await transaction.finish()
                }

                let lookup = await self.currentSubscriptionLookup(productIds: updatedProductIds)
                self.notifyListeners("entitlementUpdated", data: [
                    "activeProductIds": lookup.activeProductIds,
                    "subscriptionStatuses": lookup.subscriptionStatuses
                ])
            }
        }
    }

    private func currentSubscriptionProductIds(productIds: [String]) async -> [String] {
        await currentSubscriptionLookup(productIds: productIds).activeProductIds
    }

    private func currentSubscriptionLookup(productIds: [String]) async -> (
        activeProductIds: [String],
        subscriptionStatuses: [[String: Any]]
    ) {
        let requestedProductIds = Array(Set(productIds.filter { !$0.isEmpty }))
        if requestedProductIds.isEmpty {
            return ([], [])
        }

        do {
            let products = try await Product.products(for: requestedProductIds)
            var activeProductIds = Set<String>()
            var subscriptionStatuses: [[String: Any]] = []

            for product in products where product.type == .autoRenewable {
                guard requestedProductIds.contains(product.id),
                      let statuses = try await product.subscription?.status else {
                    continue
                }

                for status in statuses {
                    guard case .verified(let transaction) = status.transaction,
                          transaction.productID == product.id else {
                        continue
                    }

                    var serializedStatus: [String: Any] = [
                        "productId": product.id,
                        "state": Self.subscriptionStateName(status)
                    ]
                    if let expirationDate = transaction.expirationDate {
                        serializedStatus["expiresAt"] = Self.iso8601String(expirationDate)
                    }
                    if case .verified(let renewalInfo) = status.renewalInfo {
                        serializedStatus["willAutoRenew"] = renewalInfo.willAutoRenew
                    }
                    subscriptionStatuses.append(serializedStatus)

                    if Self.isEntitledSubscriptionStatus(status) {
                        activeProductIds.insert(product.id)
                    }
                }
            }

            return (
                requestedProductIds.filter { activeProductIds.contains($0) },
                subscriptionStatuses
            )
        } catch {
            return ([], [])
        }
    }

    private func currentSubscriptionStatusStates(productIds: [String]) async -> [String] {
        let requestedProductIds = Array(Set(productIds.filter { !$0.isEmpty }))
        if requestedProductIds.isEmpty {
            return []
        }

        do {
            let products = try await Product.products(for: requestedProductIds)
            var states: [String] = []

            for product in products where product.type == .autoRenewable {
                guard requestedProductIds.contains(product.id),
                      let statuses = try await product.subscription?.status else {
                    continue
                }

                for status in statuses {
                    states.append("\(product.id):\(Self.subscriptionStateName(status))")
                }
            }

            return states.sorted()
        } catch {
            return []
        }
    }

    private static func isEntitledSubscriptionStatus(_ status: Product.SubscriptionInfo.Status) -> Bool {
        switch status.state {
        case .subscribed, .inGracePeriod:
            return true
        case .expired, .inBillingRetryPeriod, .revoked:
            return false
        default:
            return false
        }
    }

    private static func subscriptionStateName(_ status: Product.SubscriptionInfo.Status) -> String {
        switch status.state {
        case .subscribed:
            return "subscribed"
        case .expired:
            return "expired"
        case .inBillingRetryPeriod:
            return "inBillingRetryPeriod"
        case .inGracePeriod:
            return "inGracePeriod"
        case .revoked:
            return "revoked"
        default:
            return "unknown"
        }
    }

    private static func serializeProduct(_ product: Product) -> [String: Any] {
        [
            "id": product.id,
            "displayName": product.displayName,
            "description": product.description,
            "displayPrice": product.displayPrice
        ]
    }

    private static func iso8601String(_ date: Date) -> String {
        ISO8601DateFormatter().string(from: date)
    }

    private static func baseProductDiagnostics(productIds: [String]) -> [String: Any] {
        let bundle = Bundle.main
        return [
            "requestedProductIds": productIds,
            "bundleIdentifier": bundle.bundleIdentifier ?? "unknown",
            "appVersion": bundle.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "unknown",
            "appBuild": bundle.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "unknown",
            "productLoadCompleted": false,
            "returnedProductCount": 0,
            "returnedProductIds": [],
            "productDisplayPrices": [],
            "entitlementLookupCompleted": false,
            "activeProductIds": []
        ]
    }
}
