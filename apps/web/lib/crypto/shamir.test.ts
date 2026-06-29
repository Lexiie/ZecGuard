import assert from "node:assert/strict";
import test from "node:test";
import { combineShares, decodeShare, reconstructPackageKey, splitPackageKey, splitSecret } from "./shamir";

const deterministicRandom = (length: number) => Uint8Array.from({ length }, (_, index) => (index * 37 + 19) & 0xff);

test("any 2 of 3 shares reconstruct the secret", () => {
  const secret = Uint8Array.from(Array.from({ length: 32 }, (_, index) => index + 1));
  const shares = splitSecret(secret, 2, 3, deterministicRandom);

  assert.deepEqual(combineShares([shares[0], shares[1]]), secret);
  assert.deepEqual(combineShares([shares[0], shares[2]]), secret);
  assert.deepEqual(combineShares([shares[1], shares[2]]), secret);
});

test("one share cannot reconstruct", () => {
  const secret = Uint8Array.from([1, 2, 3, 4]);
  const shares = splitSecret(secret, 2, 3, deterministicRandom);
  assert.throws(() => combineShares([shares[0]]), /At least 2/);
});

test("package shares carry plan and package hash bindings", () => {
  const key = Uint8Array.from(Array.from({ length: 32 }, (_, index) => 255 - index));
  const shares = splitPackageKey(key, {
    planId: "zg_plan_demo",
    packageHash: "sha256:package",
    guardianIds: ["g1", "g2", "g3"],
    threshold: 2,
    randomBytes: deterministicRandom
  });

  assert.equal(shares.length, 3);
  assert.equal(shares[0].planId, "zg_plan_demo");
  assert.equal(shares[0].packageHash, "sha256:package");
  assert.equal(decodeShare(shares[0].share).index, 1);
  assert.deepEqual(reconstructPackageKey([shares[0], shares[2]], 2), key);
});

test("rejects shares from different plans or package hashes", () => {
  const key = Uint8Array.from([9, 8, 7, 6]);
  const shares = splitPackageKey(key, {
    planId: "zg_plan_demo",
    packageHash: "sha256:package",
    guardianIds: ["g1", "g2", "g3"],
    threshold: 2,
    randomBytes: deterministicRandom
  });

  assert.throws(
    () => reconstructPackageKey([shares[0], { ...shares[1], packageHash: "sha256:other" }], 2),
    /same plan and package hash/
  );
});
