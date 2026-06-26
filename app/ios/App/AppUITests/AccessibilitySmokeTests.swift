import XCTest

final class AccessibilitySmokeTests: XCTestCase {
    private struct Scenario {
        let id: String
        let readyText: String
    }

    private let launchCriticalScenarios: [Scenario] = [
        Scenario(id: "flow-intro", readyText: "Your personal information shouldn't be for sale."),
        Scenario(id: "flow-starter-set", readyText: "Start with five brokers"),
        Scenario(id: "flow-request-review", readyText: "Set up your email template"),
        Scenario(id: "flow-gmail-send", readyText: "Connect your Gmail"),
        Scenario(id: "flow-final-review", readyText: "Final review"),
        Scenario(id: "flow-beat-subscribe", readyText: "Stay on top of it."),
        Scenario(id: "home-subscribed", readyText: "opt-out emails sent"),
        Scenario(id: "review-batch", readyText: "Send your next round of opt-out emails"),
        Scenario(id: "batch-size", readyText: "Choose how many emails to send in each group"),
        Scenario(id: "settings", readyText: "Settings"),
        Scenario(id: "settings-subscription", readyText: "Subscription")
    ]

    private var scenariosToAudit: [Scenario] {
        guard let requestedScenario = requestedScenarioFilter(), !requestedScenario.isEmpty else {
            return launchCriticalScenarios
        }

        return launchCriticalScenarios.filter { $0.id == requestedScenario }
    }

    override func setUpWithError() throws {
        // Run every scenario in the loop even after a failure so a single run
        // reports the complete punch list instead of stopping at the first screen.
        continueAfterFailure = true
    }

    func testLaunchCriticalScreensPassAccessibilityAudit() throws {
        try auditAllScenarios(largeText: false)
    }

    func testLaunchCriticalScreensPassLargeTextAccessibilityAudit() throws {
        try auditAllScenarios(largeText: true)
    }

    /// Audits every in-scope scenario and reports all findings at once. The audit
    /// handler returns `true` to collect each issue and keep going (instead of
    /// throwing on the first), so one run surfaces every failing element across
    /// every scenario rather than one-at-a-time.
    private func auditAllScenarios(largeText: Bool) throws {
        try skipIfAccessibilityAuditUnavailable()
        XCTAssertFalse(scenariosToAudit.isEmpty, "No accessibility scenarios matched the requested filter.")

        let label = largeText ? "large text " : ""
        var findings: [String] = []

        for scenario in scenariosToAudit {
            XCTContext.runActivity(named: "Audit \(scenario.id) \(label)".trimmingCharacters(in: .whitespaces)) { _ in
                let app = launchScenario(scenario, a11yText: largeText ? "large" : nil)
                waitForScenario(scenario, in: app)
                do {
                    try app.performAccessibilityAudit { issue in
                        findings.append("\(scenario.id) [\(label)]: \(self.describeIssue(issue))")
                        return true
                    }
                } catch {
                    findings.append("\(scenario.id) [\(label)]: audit threw: \(error.localizedDescription)")
                }
                app.terminate()
            }
        }

        if !findings.isEmpty {
            XCTFail("Accessibility audit found \(findings.count) issue(s):\n" + findings.joined(separator: "\n"))
        }
    }

    private func skipIfAccessibilityAuditUnavailable() throws {
        guard #available(iOS 17.0, *) else {
            throw XCTSkip("XCTest accessibility audits require iOS 17 or later.")
        }
    }

    private func describeIssue(_ issue: XCUIAccessibilityAuditIssue) -> String {
        let elementDescription = issue.element?.debugDescription ?? "no associated element"
        return "\(issue.compactDescription) | \(issue.detailedDescription) | auditType=\(issue.auditType.rawValue) | element=\(elementDescription)"
    }

    private func requestedScenarioFilter() -> String? {
        let filePath = "/tmp/scrappy-kin-a11y-scenario.txt"
        if let fileContents = try? String(contentsOfFile: filePath, encoding: .utf8) {
            let scenario = fileContents.trimmingCharacters(in: .whitespacesAndNewlines)
            if !scenario.isEmpty {
                return scenario
            }
        }

        return ProcessInfo.processInfo.environment["SCRAPPY_A11Y_SCENARIO"]
    }

    private func launchScenario(_ scenario: Scenario, a11yText: String? = nil) -> XCUIApplication {
        var route = "/capture/\(scenario.id)?qa=1"
        if let a11yText {
            route += "&a11yText=\(a11yText)"
        }

        let app = XCUIApplication()
        app.launchArguments = [
            "--scrappy-capture-route",
            route
        ]
        app.launch()
        return app
    }

    private func waitForScenario(_ scenario: Scenario, in app: XCUIApplication) {
        let predicate = NSPredicate(format: "label CONTAINS %@", scenario.readyText)
        let element = app.descendants(matching: .any).matching(predicate).firstMatch
        XCTAssertTrue(
            element.waitForExistence(timeout: 8),
            "Scenario \(scenario.id) did not render expected text: \(scenario.readyText)"
        )
    }
}
