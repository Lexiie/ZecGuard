import assert from "node:assert/strict";
import test from "node:test";
import { zecToZatoshis } from "./zingo.js";

test("converts ZEC decimal amounts to zatoshis", () => {
  assert.equal(zecToZatoshis("1"), "100000000");
  assert.equal(zecToZatoshis("0.0001"), "10000");
  assert.equal(zecToZatoshis("0.00000001"), "1");
});

test("rejects invalid ZEC amounts", () => {
  assert.throws(() => zecToZatoshis("0"), /greater than zero/);
  assert.throws(() => zecToZatoshis("0.000000001"), /at most 8 decimal/);
  assert.throws(() => zecToZatoshis("1.2.3"), /Amount must/);
});
