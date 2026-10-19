# Dependency exposure review — October 19, 2026

Status: unresolved advisory risk; no dependency or lockfile changes in this follow-up.

## Current evidence

Fresh npm 10 audit against the committed lockfile reports 17 high entries, zero critical. These dependency chains lead to two underlying advisories, not 17 demonstrated app exploits:

| Package in lockfile | Advisory | Observed local use |
| --- | --- | --- |
| braces 3.0.3 | https://github.com/advisories/GHSA-vfj7-8cjw-p6xm | micromatch in Metro filesystem watcher/build tooling |
| node-forge 1.4.0 | https://github.com/advisories/GHSA-86w9-cpqp-85rv | Expo CLI code-signing certificate tooling |

Both advisory pages checked today list no patched version. npm's suggested changes include Expo/RN major downgrades; those are not a verified remediation and were not applied. Registry latest endpoints were unavailable through the web tool; no claim is made about every published version beyond the audit/advisory evidence.

Installed source examined: `node_modules/metro-file-map/src/watchers/common.js`, `node_modules/@expo/cli/build/src/utils/codesigning.js`, `node_modules/@expo/code-signing-certificates/build/main.js` and the lockfile chains. Application `src` and hosted function source have no direct imports of braces/node-forge/micromatch.

The final follow-up iOS JavaScript export with source maps has **1,088 source entries**. None name braces, node-forge or micromatch under node_modules. This supports build-tool exposure for this exported JS graph; it is not a scan of native libraries, the EAS environment, hosted Deno transitive dependencies, historical binaries or every runtime artifact. No deliberately malicious patterns/certificates were executed against external systems.

Audit JSON remains outside Git at `/private/tmp/flavorfinder-review-audit.json`; source-map evidence is `/private/tmp/flavorfinder-review-races-ios`. No account secrets or env values are included in this report.

## Practical containment and next steps

- Keep Metro/development services local to trusted development/testing networks; do not expose unauthenticated developer tools as the public backend.
- Build reviewed source/configuration with trusted signing inputs and repository access. The exact affected signature-validation paths under EAS have not been fully traced; do not claim exploitability eliminated.
- Follow compatible upstream fixes. Before adopting a fix, refresh audit, verify no framework downgrade, clean-install, generate/export/native-build and rerun the complete suite.
- Do not disable security checks or maintain an ad hoc cryptography patch merely to produce a green audit summary.
- Keep FF-08 open until reachability/mitigation or a compatible upstream remediation is reviewed and accepted. Test-only advertising does not resolve these tooling advisories.
