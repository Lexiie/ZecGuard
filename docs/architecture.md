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

## Manual Fallback

Bridge integration must never be required for the demo flow. Users can copy generated memo text, send from a wallet manually, and paste txids back into ZecGuard.

