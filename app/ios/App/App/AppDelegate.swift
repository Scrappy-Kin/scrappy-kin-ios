import UIKit
import Capacitor
import SwiftKeychainWrapper

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
#if SCRAPPY_KIN_QA
        Self.seedQaCaptureRouteFromLaunchArguments()
#endif

        // On first launch after a fresh install, clear any keychain data left over from a
        // previous install. UserDefaults is wiped on uninstall; the keychain is not.
        // This ensures Gmail tokens and local state do not silently survive app deletion.
        let freshInstallKey = "sk_has_launched_before"
        if !UserDefaults.standard.bool(forKey: freshInstallKey) {
            KeychainWrapper(serviceName: "cap_sec").removeAllKeys()
            UserDefaults.standard.set(true, forKey: freshInstallKey)
        }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

#if SCRAPPY_KIN_QA
    private static func seedQaCaptureRouteFromLaunchArguments() {
        let argumentName = "--scrappy-capture-route"
        let preferenceKey = "CapacitorStorage.dev_capture_route"
        let arguments = ProcessInfo.processInfo.arguments

        guard let argumentIndex = arguments.firstIndex(of: argumentName),
              arguments.indices.contains(argumentIndex + 1) else {
            return
        }

        let route = arguments[argumentIndex + 1]
        guard route.hasPrefix("/capture/") else {
            return
        }

        // QA-only bridge for XCTest accessibility audits. Release/TestFlight builds do
        // not compile this path, so production cannot be steered by launch arguments.
        UserDefaults.standard.set(route, forKey: preferenceKey)
    }
#endif

}
