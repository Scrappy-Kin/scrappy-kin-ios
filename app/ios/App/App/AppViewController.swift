import Capacitor
import Security

class AppStartupViewController: UIViewController {
    private func prepareFreshInstall() -> Bool {
        let marker = "sk_has_launched_before"
        if UserDefaults.standard.bool(forKey: marker) { return true }

        // Keychain survives uninstall. Finish cleanup before creating the WebView.
        let status = SecItemDelete([
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: "cap_sec",
        ] as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else { return false }
        UserDefaults.standard.set(true, forKey: marker)
        return true
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 1, green: 192.0 / 255, blue: 192.0 / 255, alpha: 1)
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        startApp()
    }

    private func startApp() {
        view.subviews.forEach { $0.removeFromSuperview() }
        guard prepareFreshInstall() else {
            let screen = UIView()
            screen.backgroundColor = UIColor(red: 1, green: 192.0 / 255, blue: 192.0 / 255, alpha: 1)
            let message = UILabel()
            message.text = "Scrappy Kin couldn't reset saved data from a previous install. Please retry to continue."
            message.font = .preferredFont(forTextStyle: .body)
            message.adjustsFontForContentSizeCategory = true
            message.numberOfLines = 0
            message.textColor = .black
            let retry = UIButton(type: .system)
            retry.setTitle("Retry", for: .normal)
            retry.setTitleColor(.black, for: .normal)
            retry.titleLabel?.font = .preferredFont(forTextStyle: .headline)
            retry.titleLabel?.adjustsFontForContentSizeCategory = true
            retry.addTarget(self, action: #selector(retryFreshInstall), for: .touchUpInside)
            let stack = UIStackView(arrangedSubviews: [message, retry])
            stack.axis = .vertical
            stack.spacing = 24
            stack.translatesAutoresizingMaskIntoConstraints = false
            screen.addSubview(stack)
            NSLayoutConstraint.activate([
                stack.leadingAnchor.constraint(equalTo: screen.safeAreaLayoutGuide.leadingAnchor, constant: 24),
                stack.trailingAnchor.constraint(equalTo: screen.safeAreaLayoutGuide.trailingAnchor, constant: -24),
                stack.centerYAnchor.constraint(equalTo: screen.safeAreaLayoutGuide.centerYAnchor),
                retry.heightAnchor.constraint(greaterThanOrEqualToConstant: 48),
            ])
            view.addSubview(screen)
            screen.frame = view.bounds
            screen.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            return
        }
        view.window?.rootViewController = AppViewController()
    }

    @objc private func retryFreshInstall() {
        startApp()
    }
}

class AppViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(SubscriptionPlugin())
        bridge?.registerPluginInstance(ReviewPromptPlugin())
    }
}
