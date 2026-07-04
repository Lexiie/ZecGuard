# ZecGuard Bridge

Local-only Fastify bridge for ZecGuard wallet memo operations.

The bridge is optional. The web app must keep manual copy/paste fallback working when this service or `zingo-cli` is unavailable.

## Run

```bash
npm run dev:bridge
```

Defaults:

```text
host: 127.0.0.1
port: 8787
zingo cli: zingo-cli
```

Environment overrides:

```bash
ZECGUARD_BRIDGE_HOST=127.0.0.1
ZECGUARD_BRIDGE_PORT=8787
ZECGUARD_ZINGO_CLI=/path/to/zingo-cli
```

## API

```text
GET  /health
POST /wallet/send-memo
GET  /wallet/memos
GET  /wallet/tx/:txid
POST /wallet/sync
```

## Send Memo Body

```json
{
  "to": "u1_or_shielded_guardian_address",
  "amount": "0.0001",
  "memo": "ZECGUARD:v0\ntype:GUARDIAN_INVITE\n..."
}
```

The bridge rejects memo payloads that do not start with `ZECGUARD:v0`. It does not accept guardian shares in memos for the MVP.

## zingo-cli Mapping

The bridge expects the current `zingo-cli` command shape:

```text
send memo:   zingo-cli quicksend <address> <amount in zatoshis> "<memo>"
list memos:  zingo-cli messages ZECGUARD:v0
sync wallet: zingo-cli sync run
tx list:     zingo-cli transactions
```

The web UI sends memo amounts as decimal ZEC, for example `0.0001`. The bridge converts those values to zatoshis before calling `zingo-cli`.

## Failure Mode

If `zingo-cli` is unavailable or wallet sync fails, the bridge returns a clear error. The web app should keep copy/manual txid fallback available.
