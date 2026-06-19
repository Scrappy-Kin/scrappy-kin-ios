fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios qa_device

```sh
[bundle exec] fastlane ios qa_device
```

Build, verify, install, and launch QADevice on a connected iPhone.

### ios qa_device_fast

```sh
[bundle exec] fastlane ios qa_device_fast
```

Fast web-only QADevice loop: rebuild web assets, copy them into iOS, install, and launch.

### ios qa_simulator

```sh
[bundle exec] fastlane ios qa_simulator
```

Build, verify, install, and launch QADevice on a simulator.

### ios prod_archive

```sh
[bundle exec] fastlane ios prod_archive
```

Build the production Release archive for App Store Connect without uploading.

### ios prod_testflight

```sh
[bundle exec] fastlane ios prod_testflight
```

Build the production Release archive and upload it to TestFlight. Requires SCRAPPY_KIN_ALLOW_PROD_TESTFLIGHT=1.

### ios upload_testflight_ipa

```sh
[bundle exec] fastlane ios upload_testflight_ipa
```

Upload an already-signed IPA to TestFlight without building. Requires IPA_PATH and SCRAPPY_KIN_ALLOW_PROD_TESTFLIGHT=1.

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
