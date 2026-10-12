# Signed build 10 privacy manifest inventory — October 12, 2026

Inspected the actual EAS IPA for com.mardanjoe.flavorfinder, build 10. Evidence: ignored verification/build10-privacy-manifests.json. This inventories declarations; it does not certify required-reason correctness, runtime provider collection, or final App Store answers.

| Bundled manifest | Declared API categories/reasons |
| --- | --- |
| React-timing_privacy.bundle/PrivacyInfo.xcprivacy | NSPrivacyAccessedAPICategorySystemBootTime: 35F9.1 |
| ExpoConstants_privacy.bundle/PrivacyInfo.xcprivacy | NSPrivacyAccessedAPICategoryUserDefaults: CA92.1 |
| React-cxxreact_privacy.bundle/PrivacyInfo.xcprivacy | NSPrivacyAccessedAPICategoryFileTimestamp: C617.1 |
| PrivacyInfo.xcprivacy | NSPrivacyAccessedAPICategoryUserDefaults: CA92.1; NSPrivacyAccessedAPICategoryFileTimestamp: C617.1; NSPrivacyAccessedAPICategorySystemBootTime: 35F9.1 |
| Frameworks/ReactNativeDependencies.framework/ReactNativeDependencies_folly.bundle/PrivacyInfo.xcprivacy | NSPrivacyAccessedAPICategoryFileTimestamp: C617.1 |
| Frameworks/ReactNativeDependencies.framework/ReactNativeDependencies_glog.bundle/PrivacyInfo.xcprivacy | NSPrivacyAccessedAPICategoryFileTimestamp: C617.1 |
| Frameworks/ReactNativeDependencies.framework/ReactNativeDependencies_boost.bundle/PrivacyInfo.xcprivacy | NSPrivacyAccessedAPICategoryFileTimestamp: C617.1; NSPrivacyAccessedAPICategorySystemBootTime: 35F9.1 |
| RNCAsyncStorage_resources.bundle/PrivacyInfo.xcprivacy | NSPrivacyAccessedAPICategoryFileTimestamp: C617.1 |
| React-Core_privacy.bundle/PrivacyInfo.xcprivacy | NSPrivacyAccessedAPICategoryFileTimestamp: C617.1; NSPrivacyAccessedAPICategoryUserDefaults: CA92.1 |

All nine manifests declare empty collected-data lists. Eight explicitly declare tracking false; AsyncStorage omits the tracking key. The app-level manifest includes UserDefaults CA92.1, FileTimestamp C617.1 and SystemBootTime 35F9.1. These files do not describe stored Supabase accounts/votes or provider logs; reconcile those separately in final privacy disclosures.

Info.plist confirms location usage explanation and non-exempt encryption false. Final required-reason review, provider retention, account data/privacy declarations and physical-device behavior remain launch gates.
