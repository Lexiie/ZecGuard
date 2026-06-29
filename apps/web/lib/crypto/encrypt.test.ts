import assert from "node:assert/strict";
import test from "node:test";
import { decryptJson, encryptJson, exportRawKey, generatePackageKey, importRawKey } from "./encrypt";
import { sha256Hex } from "./hash";

test("encrypts and decrypts recovery package JSON", async () => {
  const packageBody = {
    ownerNote: "Demo owner",
    walletType: "Zashi",
    dummySecret: "dummy-secret-only",
    recoveryInstructions: "Use two guardian shares."
  };
  const hash = `sha256:${await sha256Hex(JSON.stringify(packageBody))}`;
  const key = await generatePackageKey();

  const encryptedPackage = await encryptJson("zg_plan_demo", hash, packageBody, key);
  assert.equal(encryptedPackage.planId, "zg_plan_demo");
  assert.equal(encryptedPackage.hash, hash);
  assert.notEqual(encryptedPackage.ciphertext.includes("dummy-secret-only"), true);

  const decrypted = await decryptJson<typeof packageBody>(encryptedPackage, key);
  assert.deepEqual(decrypted, packageBody);
});

test("exports and imports AES-GCM package keys", async () => {
  const key = await generatePackageKey();
  const raw = await exportRawKey(key);
  assert.equal(raw.length, 32);

  const imported = await importRawKey(raw);
  const packageBody = { note: "roundtrip" };
  const hash = `sha256:${await sha256Hex(JSON.stringify(packageBody))}`;
  const encrypted = await encryptJson("zg_plan_key", hash, packageBody, imported);
  assert.deepEqual(await decryptJson<typeof packageBody>(encrypted, key), packageBody);
});
