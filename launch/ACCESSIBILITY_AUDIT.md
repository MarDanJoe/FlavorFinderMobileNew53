# Accessibility audit — October 1, 2026

Implemented this pass:
- Darkened shared muted text and accent colors for readable small text on the light surfaces.
- Enlarged discovery filter/undo, filter close/chips and legal-link targets to at least 48 logical pixels.
- Marked discovery title/filter title as headings; added location expanded/disabled/busy states and room button disabled/busy states.
- Filter modal declares modal accessibility, supports the accessibility escape gesture and hides the decorative dismissal backdrop from the accessibility tree.

Existing: discovery save/pass/detail and voting like/pass buttons provide alternatives to swipe gestures. Native Text keeps platform font scaling enabled. Legal screens already expose headings and links.

These source improvements do not constitute a completed accessibility audit. Before launch, test VoiceOver focus order and announcements on physical iPhones; filter modal opening/closing and focus return; large accessibility text without clipping; keyboard/safe-area handling; loading/errors and changing voting results; reduced-motion preference; all remaining controls, contrast pairs and touch targets. Disabled-control contrast is not the same as enabled text contrast.

Web legal pages currently have h1/h2 structure and focus outlines. Add and verify a skip-navigation link with actual keyboard focus behavior in a separate website pass; native accessibility navigation has a different model.
