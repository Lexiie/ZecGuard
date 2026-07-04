# ZecGuard Memo Format

All ZecGuard memos start with:

```text
ZECGUARD:v0
```

Required message types:

- `GUARDIAN_INVITE`
- `GUARDIAN_ACK`
- `PACKAGE_ANCHOR`

## Guardian Invite

```text
ZECGUARD:v0
type:GUARDIAN_INVITE
plan_id:<plan_id>
guardian_id:<guardian_id>
threshold:<m-of-n>
package_hash:<package_hash>
reply_to:<owner_zcash_address>
note:<short_note>
```

## Guardian ACK

```text
ZECGUARD:v0
type:GUARDIAN_ACK
plan_id:<plan_id>
guardian_id:<guardian_id>
package_hash:<package_hash>
status:received
```

## Package Anchor

```text
ZECGUARD:v0
type:PACKAGE_ANCHOR
plan_id:<plan_id>
package_hash:<package_hash>
version:0
```

## MVP Rule

Do not put seed phrases, spending keys, viewing keys, or guardian shares in plaintext memos.

## Scanner Behavior

Wallet and bridge output may contain unrelated text. ZecGuard scans that output for `ZECGUARD:v0` blocks, parses them with the same strict memo parser, and ignores malformed or unrelated payloads. ACKs are accepted only when the plan ID, guardian ID, and package hash match the active plan.
