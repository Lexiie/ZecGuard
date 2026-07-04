# Architecture

```text
Owner Browser UI
  |
  | create / encrypt / split
  v
ZecGuard Local App
  |
  | send memo request or manual copy
  v
Local Wallet Bridge
  |
  | zingo-cli / wallet backend
  v
Zcash Mainnet
  |
  | shielded memo tx
  v
Guardian Wallet
```

## Apps

- `apps/web`: Next.js App Router frontend.
- `apps/bridge`: Fastify local-only bridge wrapping wallet tooling.

## Local Data

The web app is designed for local-first storage using IndexedDB and JSON export/import. The bridge does not store recovery packages or guardian shares.

## Bridge Memo Scanning

The bridge exposes wallet sync and memo listing endpoints. The web app treats their output as untrusted local text, scans only for valid `ZECGUARD:v0` payloads, and records guardian ACKs only when plan ID, guardian ID, and package hash match the active recovery plan.

## Manual Fallback

Bridge integration must never be required for the demo flow. Users can copy generated memo text, send from a wallet manually, and paste txids back into ZecGuard.
