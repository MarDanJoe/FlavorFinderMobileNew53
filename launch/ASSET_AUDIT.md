# Asset audit — October 1, 2026

This inventory records evidence, not a blanket clearance of every asset.

| Asset | Where used | Evidence / status |
| --- | --- | --- |
| System text fonts and emoji | Native app and legal website | No downloaded text font in source; platform-provided rendering. Check signed build for unexpected bundled fonts. |
| Ionicons font | App interface via @expo/vector-icons | Upstream Ionicons MIT license: https://github.com/ionic-team/ionicons/blob/main/LICENSE. Expo wrapper MIT notice retained at assets/licenses/expo-vector-icons-MIT.txt. Preserve required notices in distributed app acknowledgements before launch. |
| Google Maps logo | Restaurant attribution | Official attribution archive and display instructions recorded in assets/google/README.md. Subject to Google policies, not a general-purpose branding asset. |
| Google restaurant photos/reviews | Discovery, detail, saved and voting screens | Loaded through hosted provider; author/provider credits retained. Do not redistribute as app-owned promotional artwork. Physical-device attribution QA pending. |
| brand-icon.svg, brand-icon.png, brand-splash.png, brand-favicon.png | Current app identity | SVG source is in repository; added in the app preparation checkpoint. Creation/provenance and any source inputs need confirmation from original work history. Do not infer exclusive trademark rights from possession of a source file. |
| adaptive-icon.png | Android configuration | Legacy asset provenance undocumented; verify or replace before Android distribution. |
| pizza.png, tacos.png, sushi.png, burger.png, brunch.png | Web-only sample data | Provenance/license undocumented in repository. Native sample-data module excludes these food images; avoid publishing a public demo or using them in store screenshots until cleared or replaced. |
| icon.png, splash-icon.png, favicon.png | Legacy files | Not referenced by current iOS/web branding config. Provenance undocumented; inventory separately before reuse. |

Remaining: confirm branding creation history, clear/replace legacy imagery, include full third-party notices in distributed acknowledgements, inspect native bundle and keep source/license evidence with future assets. No AI-image license claim can be made without knowing which tool, terms and inputs produced the image.

Follow-up source trace: git history identifies f3f7c55 as the addition of current branding and all five sample food images. No original download URL, tool receipt, prompt or image license was found in repository documentation. Git provenance establishes when files entered the repository, not permission to use the underlying content. Native config continues to exclude sample food images; current iOS branding still needs creation-source confirmation.
