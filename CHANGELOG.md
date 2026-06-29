# Changelog

## v0.1.0-local-mvp - Local MVP Complete

This tag marks the first complete local-first ZecGuard MVP prototype.

### Complete

- Next.js App Router web app scaffold.
- Local Fastify wallet bridge scaffold.
- Local recovery plan creation.
- 2-of-3 guardian setup.
- AES-GCM encrypted recovery package generation.
- SHA-256 package hash generation.
- Shamir guardian share split and reconstruction.
- ZecGuard `ZECGUARD:v0` memo format generation and parsing.
- Manual memo copy and txid fallback.
- Local bridge health check and send-memo wiring.
- Guardian ACK memo parser.
- Readiness dashboard.
- Encrypted package JSON export.
- Per-guardian share JSON export.
- Package/share import for reconstruction drill.
- Hash verification after decrypting the reconstructed package.
- Web-rendered project docs.
- README with badges and screenshot.
- Tests for crypto helpers, Shamir reconstruction, and memo parsing.

### Pending For Hackathon Proof

- Real Zcash mainnet `GUARDIAN_INVITE` memo transaction.
- Optional real `GUARDIAN_ACK` memo transaction.
- Verified `zingo-cli` bridge run with a synced wallet.
- Demo video or narrated walkthrough.
- Mainnet txid references in README/demo docs.

### Safety Status

This is a hackathon prototype. Use dummy material only. Do not enter a real seed phrase, spending key, or high-value recovery material.

