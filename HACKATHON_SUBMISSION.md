# ZecGuard Hackathon Submission

## Summary

ZecGuard is a local-first Zcash recovery readiness prototype. It helps a ZEC holder create an encrypted recovery package, split access across trusted guardians, coordinate readiness through Zcash shielded memos, and run a reconstruction drill.

ZecGuard is not a deadman switch, does not custody funds, does not upload recovery material, and does not automatically release secrets or move ZEC.

## Track

- Primary: FROST / Social Recovery
- Secondary: Infrastructure

## Zcash Mainnet Interaction

ZecGuard uses Zcash shielded memos as the private coordination layer for guardian invites, ACKs, and package anchors.

The submitted video uses testnet framing and dummy recovery material for safety, but the protocol target is Zcash mainnet shielded memo coordination. The MVP supports bridge-based memo sending through a local `zingo-cli` wrapper and manual memo copy fallback.

Mainnet proof fields for final submission:

```text
Invite txid: TODO
ACK txid: TODO
Network: Zcash mainnet
Memo prefix: ZECGUARD:v0
```

No production recovery material is used in the MVP demo.

## Prototype Scope

Implemented MVP flow:

```text
Create -> Encrypt -> Split -> Send Memo -> Acknowledge -> Verify -> Reconstruct
```

- Create a local recovery plan with dummy material.
- Encrypt a recovery package locally with AES-GCM.
- Split the package encryption key into 2-of-3 guardian shares.
- Generate and parse `ZECGUARD:v0` memo payloads.
- Send invite memos through an optional local bridge or manual wallet fallback.
- Scan local bridge memo output for matching guardian ACKs.
- Track guardian readiness status.
- Reconstruct and decrypt with threshold shares.
- Verify decrypted package integrity against the package hash.

## Safety Boundaries

- Use dummy secrets only.
- Do not enter a real seed phrase, spending key, viewing key, or high-value recovery material.
- Guardian shares are not sent through Zcash memos.
- Memos carry coordination data only: plan IDs, guardian IDs, statuses, package hashes, and reply hints.
- The local bridge is optional; manual fallback remains usable.
- This is a hackathon prototype and has not received a production security review.

## Demo Script

1. Open the ZecGuard web app.
2. Create an `Emergency ZEC Recovery` plan with dummy material only.
3. Add three guardians and keep the 2-of-3 threshold.
4. Run the package drill to generate the encrypted package, package hash, guardian shares, invite memos, ACK memos, and verification result.
5. Show that guardian shares are exported separately and never placed in memos.
6. Send or manually copy a `GUARDIAN_INVITE` memo.
7. Record the invite txid or show the bridge-returned txid.
8. Sync and scan bridge memo output for a `GUARDIAN_ACK`, or paste an ACK manually.
9. Show the dashboard reaching 2-of-3 readiness.
10. Import the encrypted package and two share files on the reconstruction page.
11. Run the drill and show package hash verification passing.

## Setup

Install dependencies:

```bash
npm install
```

Run the web app:

```bash
npm run dev:web
```

WSL-friendly web command:

```bash
npm run dev --workspace @zecguard/web -- -H 0.0.0.0 -p 3000
```

Run the optional bridge:

```bash
npm run dev:bridge
```

Run validation:

```bash
npm run typecheck
npm run test
npm run build
```

## Links

```text
Repository: https://github.com/Lexiie/ZecGuard
Video demo: assets/demo.mp4
ZecHub PR: TODO
```
