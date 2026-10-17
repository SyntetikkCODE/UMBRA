# Code signing policy

## Current status

The application to SignPath Foundation was submitted on 2026-10-16 (submission confirmation received). No application approval, signing certificate or production signing grant is claimed at this stage. Unsigned review builds must be clearly labelled as such.

After acceptance, add the required statement with the Foundation’s authorization: “Free code signing provided by SignPath.io, certificate by SignPath Foundation”. Do not display this as an existing endorsement before acceptance.

## Team roles

- Author and maintainer: [SyntetikkCODE](https://github.com/SyntetikkCODE).
- Reviewer: SyntetikkCODE; contributors’ pull requests require review before merging.
- Release approver: SyntetikkCODE. Confirm the final role arrangement with SignPath during onboarding.

Enable multi-factor authentication on GitHub and SignPath. Protect the main branch, restrict workflow changes and require manual approval of production signing requests. Register the SignPath GitHub App with access only to the UMBRA repository.

## Scope and build origin

Sign only UMBRA-owned executables built from the public repository on GitHub-hosted Windows runners. The custom signing hook sends the app executable, NSIS uninstaller and final installer separately while packaging, so the installer includes the already signed app and uninstaller. Third-party executables must not be re-signed under the Foundation’s identity.

The pipeline uses the official SignPath action pinned to a commit. Before each signing request, its input file is uploaded as a GitHub Actions artifact. The connector is responsible for verifying that origin. Local builds cannot claim this provenance.

Each returned file must have a valid Authenticode signature, a timestamp, the configured publisher identity and the expected UMBRA product/version metadata. Missing credentials, rejection, a failed service or verification error stop the build. There is no unsigned fallback in a signing build.

## Publication

Signing and publication are separate. A reviewed signed installer receives new update hashes and blockmap; the existing Ed25519 update manifest is signed locally before publication. Do not replace bytes behind a previously published version. No deployment or signing private key is stored in this repository.

## Privacy

See [PRIVACY.md](PRIVACY.md). UMBRA connects to the configured team server for accounts, messages, coordination and voice, and to its update server to discover and download releases. It does not record voice or store an input history from the global shortcut hook.

Official requirements: [SignPath Foundation terms](https://signpath.org/terms.html), [GitHub trusted build integration](https://docs.signpath.io/trusted-build-systems/github).

