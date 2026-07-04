import assert from "node:assert/strict";
import test from "node:test";
import { formatZecGuardMemo, parseZecGuardMemo, scanZecGuardMemos, ZECGUARD_MEMO_PREFIX } from "./memo";

test("formats and parses guardian invite memos", () => {
  const memo = {
    type: "GUARDIAN_INVITE" as const,
    plan_id: "zg_plan_abc123",
    guardian_id: "g1",
    threshold: "2-of-3",
    package_hash: "sha256:deadbeef",
    reply_to: "u1owner",
    note: "Please confirm readiness."
  };

  const formatted = formatZecGuardMemo(memo);
  assert.equal(formatted.startsWith(`${ZECGUARD_MEMO_PREFIX}\n`), true);
  assert.deepEqual(parseZecGuardMemo(formatted), memo);
});

test("parses ACK status without changing identifiers", () => {
  const parsed = parseZecGuardMemo(`ZECGUARD:v0
type:GUARDIAN_ACK
plan_id:zg_plan_ExactCase
guardian_id:Guardian-01
package_hash:sha256:ABCdef123
status:received`);

  assert.equal(parsed.plan_id, "zg_plan_ExactCase");
  assert.equal(parsed.guardian_id, "Guardian-01");
  assert.equal(parsed.package_hash, "sha256:ABCdef123");
  assert.equal(parsed.status, "received");
});

test("rejects malformed memos", () => {
  assert.throws(() => parseZecGuardMemo("type:GUARDIAN_INVITE"), /prefix/);
  assert.throws(
    () =>
      parseZecGuardMemo(`ZECGUARD:v0
type:GUARDIAN_INVITE
plan_id:zg_plan_missing_fields`),
    /Missing memo field/
  );
  assert.throws(
    () =>
      parseZecGuardMemo(`ZECGUARD:v0
type:GUARDIAN_SHARE
plan_id:zg_plan_abc
package_hash:sha256:abc`),
    /Unsupported/
  );
});

test("formats package anchor memos", () => {
  const formatted = formatZecGuardMemo({
    type: "PACKAGE_ANCHOR",
    plan_id: "zg_plan_anchor",
    package_hash: "sha256:f00d",
    version: "0"
  });

  assert.equal(
    formatted,
    `ZECGUARD:v0
type:PACKAGE_ANCHOR
plan_id:zg_plan_anchor
package_hash:sha256:f00d
version:0`
  );
});

test("scans valid ZecGuard memos from raw wallet text", () => {
  const rawOutput = `txid:abc123
memo:
ZECGUARD:v0
type:GUARDIAN_ACK
plan_id:zg_plan_scan
guardian_id:g2
package_hash:sha256:feed
status:received
confirmations:3`;

  const matches = scanZecGuardMemos(rawOutput);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].memo.type, "GUARDIAN_ACK");
  assert.equal(matches[0].memo.plan_id, "zg_plan_scan");
  assert.equal(matches[0].memo.guardian_id, "g2");
});

test("scans escaped memo strings from JSON bridge output", () => {
  const payload = formatZecGuardMemo({
    type: "GUARDIAN_ACK",
    plan_id: "zg_plan_json",
    guardian_id: "g1",
    package_hash: "sha256:cafe",
    status: "received"
  });

  const matches = scanZecGuardMemos(JSON.stringify({ txid: "tx_json", memo: payload }));
  assert.equal(matches.length, 1);
  assert.equal(matches[0].payload, payload);
});

test("scanner skips malformed ZecGuard-looking payloads", () => {
  const matches = scanZecGuardMemos(`ZECGUARD:v0
type:GUARDIAN_ACK
plan_id:zg_plan_bad`);

  assert.equal(matches.length, 0);
});
