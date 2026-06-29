export type EncryptedPackage = {
  version: "0.1";
  planId: string;
  ciphertext: string;
  nonce: string;
  hash: string;
  createdAt: string;
};

export async function generatePackageKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

export async function exportRawKey(key: CryptoKey): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.exportKey("raw", key));
}

export async function importRawKey(rawKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", toArrayBuffer(rawKey), "AES-GCM", true, ["encrypt", "decrypt"]);
}

export async function encryptJson(planId: string, hash: string, payload: unknown, key: CryptoKey): Promise<EncryptedPackage> {
  const nonce = new Uint8Array(12);
  crypto.getRandomValues(nonce);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(nonce) }, key, toArrayBuffer(plaintext));

  return {
    version: "0.1",
    planId,
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    nonce: toBase64(nonce),
    hash,
    createdAt: new Date().toISOString()
  };
}

export async function decryptJson<T>(encryptedPackage: EncryptedPackage, key: CryptoKey): Promise<T> {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(fromBase64(encryptedPackage.nonce)) },
    key,
    toArrayBuffer(fromBase64(encryptedPackage.ciphertext))
  );

  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string): Uint8Array {
  const decoded = atob(value);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
