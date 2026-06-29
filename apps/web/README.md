# ZecGuard Web

Next.js App Router frontend for the ZecGuard MVP.

## Run

```bash
npm run dev:web
```

The web app uses local browser state and JSON export/import. It does not require a hosted backend.

## Bridge URL

By default the web app tries the local bridge at:

```text
http://127.0.0.1:8787
```

Override with:

```bash
NEXT_PUBLIC_ZECGUARD_BRIDGE_URL=http://127.0.0.1:8787
```

Manual memo copy and txid recording must remain usable when the bridge is unavailable.

