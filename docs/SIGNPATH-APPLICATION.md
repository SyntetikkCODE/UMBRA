# SignPath Foundation application draft

Status: draft for maintainer review, not submitted. Contact details and the final public repository URL must be confirmed before submission. Artwork review remains open as described below.

**Project:** UMBRA — Wardogs Companion

**Maintainer / GitHub:** SyntetikkCODE — https://github.com/SyntetikkCODE

**Public repository:** https://github.com/SyntetikkCODE/UMBRA

**Website / existing releases:** https://umbra.lotus-order.fr/

**Purpose:** A free Windows Electron application for a French gaming community of more than 40 players. UMBRA manages squads, roles, operations, shared briefings, squad/leader voice communications through LiveKit and private text channels. Users create accounts on their community’s server. There are no demo player accounts and no voice recording.

**Current release:** 0.14.2, distributed as an unsigned NSIS x64 installer. The source candidate for onboarding is 0.14.3 and has not been deployed.

**License:** Own application code: MIT. Dependencies retain their MIT, BSD, Apache, OFL and LGPL notices. Five class-role SVGs were manually redrawn from a game reference. The maintainer considers them usable but has no formal open-source license for the referenced artwork; this point needs clarification or replacement before asserting complete eligibility.

**Signing scope:** UMBRA.exe, the generated NSIS uninstaller and the final NSIS installer. Do not sign upstream Electron/helper binaries under the Foundation identity. Product/version metadata are restricted in the proposed artifact configuration.

**Build / provenance:** Public-source GitHub Actions on GitHub-hosted Windows runners, with a lockfile, tests, dependency notices and a self-contained installer build. Each executable is uploaded as a workflow artifact and submitted through the official SignPath GitHub connector/action during packaging. Returned signatures must be valid, timestamped and match the configured publisher and UMBRA metadata.

**Roles:** SyntetikkCODE is currently the maintainer, reviewer and proposed release approver. Multi-factor authentication, branch protection and the final approver arrangement must be confirmed during onboarding.

**Privacy:** See PRIVACY.md. The app communicates with the selected team API and LiveKit server and checks its update service. No input history or voice recording is stored by the shortcut/voice client.

**Why assistance is requested:** The project is free for a small community and the individual maintainer cannot fund a commercial signing service. A trusted signature would identify the release publisher and reduce concern about installing unsigned software. No guarantee of immediate SmartScreen reputation is claimed.

**Open items:** Public repository, maintainer contact email, artwork rights, SignPath account acceptance, project/policy IDs, confirmed publisher identity, protected signing environment, first real GitHub-origin signing round-trip.

Application: https://signpath.org/apply.html

