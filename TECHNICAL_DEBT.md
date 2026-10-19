# Technical debt

The detailed issue register is AUDIT_REPORT.md; execution order is IMPROVEMENT_ROADMAP.md. Do not duplicate status across historical launch notes.

| Area | Deliberate compromise / next evidence |
| --- | --- |
| Framework | Keep Expo/RN stack; assess advisory reachability and compatible patches rather than force audit downgrades (FF-08). |
| Types | Non-strict app compiler, some `any` contracts, excluded Deno functions; incrementally strengthen boundary types (FF-11). |
| Screens | Large stateful Home/Room screens; extract only with preserved behavior and better rendered tests (FF-12). |
| Tests | Custom hook/RN stubs and PGlite have value but do not model actual gestures, rendering, hosted Auth or multi-instance concurrency (FF-09/11/12). |
| Legacy | Local hash helper/direct dependency and old ENV storage constants remain; no active local-password sign-in (FF-14). Local proxy is an explicitly different legacy developer tool. |
| Costs | Beta-wide 100/day budget, no business capacity evidence; quota boolean conflates minute/day rejection (FF-07). |
| Retention | Room cleanup exists, unused anonymous Auth cleanup does not; approval and cascade-aware policy required (FF-13). |
| Recovery | No proven encrypted backup/restore drill in evidence; urgent operational debt (FF-06). |
| Ads | Test-only Saved banner, no phone acceptance yet, no retry after initial consent failure until restart (FF-09/18). |
| Distribution | Internal beta, final manifests/Apple answers/branding/reviewer data outstanding (FF-10). |

Account/room race items FF-16 and FF-17 are hypotheses to reproduce, not confirmed security incidents. No unmeasured performance improvement or claim that additional infrastructure is required follows from this inventory.
