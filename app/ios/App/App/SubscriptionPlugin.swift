import Foundation
import Capacitor
import StoreKit

@objc(SubscriptionPlugin)
public class SubscriptionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SubscriptionPlugin"
    public let jsName = "Subscription"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getEntitlement", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise)
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

                call.resolve([
                    "products": sortedProducts.map(Self.serializeProduct)
                ])
            } catch {
                call.reject(error.localizedDescription, "PRODUCT_LOAD_FAILED")
            }
        }
    }

    @objc func getEntitlement(_ call: CAPPluginCall) {
        let productIds = call.getArray("productIds", String.self) ?? []

        Task {
            let activeProductIds = await currentEntitlementProductIds(filteredTo: productIds)
            call.resolve(["activeProductIds": activeProductIds])
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
                        let activeProductIds = await currentEntitlementProductIds(filteredTo: [productId])
                        call.resolve([
                            "status": "purchased",
                            "activeProductIds": activeProductIds
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
        Task {
            do {
                try await AppStore.sync()
                let activeProductIds = await currentEntitlementProductIds(filteredTo: nil)
                call.resolve(["activeProductIds": activeProductIds])
            } catch {
                call.reject(error.localizedDescription, "RESTORE_FAILED")
            }
        }
    }

    private func startTransactionUpdates() {
        transactionUpdatesTask?.cancel()
        transactionUpdatesTask = Task { [weak self] in
            guard let self else { return }

            for await result in Transaction.updates {
                if case .verified(let transaction) = result {
                    await transaction.finish()
                }

                let activeProductIds = await self.currentEntitlementProductIds(filteredTo: nil)
                self.notifyListeners("entitlementUpdated", data: [
                    "activeProductIds": activeProductIds
                ])
            }
        }
    }

    private func currentEntitlementProductIds(filteredTo productIds: [String]?) async -> [String] {
        let filter = productIds.map(Set.init)
        var activeProductIds: [String] = []

        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else {
                continue
            }

            if let filter, !filter.contains(transaction.productID) {
                continue
            }

            activeProductIds.append(transaction.productID)
        }

        return activeProductIds
    }

    private static func serializeProduct(_ product: Product) -> [String: Any] {
        [
            "id": product.id,
            "displayName": product.displayName,
            "description": product.description,
            "displayPrice": product.displayPrice
        ]
    }
}
