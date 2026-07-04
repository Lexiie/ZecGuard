# Demo Flow

## Setup

- Owner wallet with a small ZEC balance.
- Guardian wallet or manual guardian ACK txid.
- Wallet sync completed before recording.
- Manual fallback txid ready if live sync is slow.

## Flow

1. Create `Emergency ZEC Recovery` plan.
2. Add three guardians and choose `2-of-3`.
3. Encrypt the package locally.
4. Generate package hash and guardian shares.
5. Export encrypted package JSON.
6. Export each guardian share JSON separately.
7. Generate `GUARDIAN_INVITE` memo.
8. Send through local bridge or copy into wallet manually.
9. Record invite txid.
10. Sync and scan bridge memo output for guardian `GUARDIAN_ACK`, or paste an ACK manually.
11. Show dashboard reaching `2/3 confirmed`.
12. Import encrypted package and two share files on the reconstruction page.
13. Run reconstruction drill and verify hash.

## Export / Import Drill

The package page can download:

- encrypted package JSON;
- one share JSON per guardian.

The reconstruction page can import the encrypted package JSON plus two guardian share JSON files. This keeps the drill local-first and does not rely on browser state surviving between sessions.

## ACK Scanning

The send page can ask the local bridge to sync the wallet and list memo output. ZecGuard scans that local output for valid `ZECGUARD:v0` ACK payloads that match the active plan ID and package hash. Malformed or unrelated memo payloads are ignored, and manual paste fallback remains available.

## Funding Note

Use only enough ZEC for memo transactions and fees. The PRD recommends a `0.01 ZEC` demo buffer and `0.0001 ZEC` memo transaction amount.
