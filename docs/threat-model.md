# Threat Model

ZecGuard is a hackathon prototype for recovery readiness. It is not production-grade recovery software.

## Assets

- Recovery package.
- Package encryption key.
- Guardian shares.
- Guardian identities and addresses.
- Package hash and plan metadata.
- Local app state.
- Wallet memo transaction records.

## Adversaries

- Malicious guardian.
- Colluding guardians.
- Compromised browser or local machine.
- Malicious local bridge.
- Phishing clone.
- Wallet sync server observer.
- Accidental user error.

## MVP Assumptions

- The user's device is trusted for the demo.
- Users enter dummy secrets only.
- The bridge is local-only and optional.
- Guardian addresses are entered correctly.
- Zcash memo delivery works through the chosen wallet tooling.

## Mitigations

- No hosted backend.
- No account system.
- No cloud sync.
- No automatic release or liveness oracle.
- Local encryption.
- Threshold shares.
- Manual fallback.
- Explicit prototype warning.
- Package hash verification during reconstruction drills.

## Known Risks

Enough colluding guardians can reconstruct the package key. Lost shares can make recovery impossible. Memo timing can still leak coordination patterns. A compromised local device can compromise local secrets.

Exported encrypted packages and guardian share files are sensitive local artifacts. A single share should not decrypt the package, but enough exported shares can reconstruct the package key. Store exported shares separately and never send them through Zcash memos in the MVP.
