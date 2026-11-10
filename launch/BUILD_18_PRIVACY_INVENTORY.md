# Signed build 18 privacy inventory

Inspected the actual signed EAS IPA, native version 1.0.0 (18), bundle com.mardanjoe.flavorfinder. SHA-256: `fa60fbdf071a1b1318fa41f0f061ffe4c2fd2f9db2f2eda5242ffeb34efea8f2`.

Twelve bundled PrivacyInfo.xcprivacy manifests were parsed. Local detailed evidence is ignored at verification/build18-release/privacy-inventory.json. This records declarations, not proof of runtime tracking or provider retention.

## Google ads and consent declarations

### UserMessagingPlatformResources.bundle

| Data | Linked | Tracking-capable declaration | Purposes |
| --- | --- | --- | --- |
| CoarseLocation | False | False | AppFunctionality |
| PerformanceData | False | False | AppFunctionality |
| ProductInteraction | False | False | AppFunctionality |

### GoogleMobileAdsResources.bundle

| Data | Linked | Tracking-capable declaration | Purposes |
| --- | --- | --- | --- |
| OtherDiagnosticData | False | False | ThirdPartyAdvertising, DeveloperAdvertising, Analytics |
| CoarseLocation | True | False | ThirdPartyAdvertising, Analytics, DeveloperAdvertising |
| PerformanceData | False | False | ThirdPartyAdvertising, DeveloperAdvertising, Analytics |
| CrashData | False | False | Analytics |
| AdvertisingData | True | False | ThirdPartyAdvertising, DeveloperAdvertising, Analytics |
| ProductInteraction | True | False | Analytics, DeveloperAdvertising, ThirdPartyAdvertising |
| DeviceID | True | True | ThirdPartyAdvertising, Analytics, DeveloperAdvertising |

## App configuration

- iPhone only (UIDeviceFamily [1]); no iPad screenshot requirement from this binary.
- Optional location permission explanation present.
- No NSUserTrackingUsageDescription; no ATT prompt configured.
- App manifest declares tracking false and no collected data; this does not override SDK or backend data obligations.
- Google ads manifest declares Device ID potentially used for tracking. Reconcile actual SDK/consent configuration before choosing tracking answers; a capability declaration alone does not prove tracking occurs.
- App requires reasons: UserDefaults CA92.1, FileTimestamp C617.1, SystemBootTime 35F9.1, DiskSpace E174.1. Bundled Google ads adds DiskSpace; do not rely on the older build10 inventory.
- Non-exempt encryption false, Google app ID matches configured inventory, delayed measurement enabled.
- EAS production profile at build18 remains test ads. Do not submit it claiming live inventory.

Remaining: final provider data/linkage/retention and tracking determination, final native release configuration/device acceptance, Apple disclosure entry. Official references: https://developers.google.com/admob/ios/privacy/data-disclosure and https://developer.apple.com/app-store/app-privacy-details/ .
