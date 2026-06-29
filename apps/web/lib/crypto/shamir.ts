const SHARE_PREFIX = "zg_share_v0";

export type GuardianShare = {
  planId: string;
  guardianId: string;
  shareIndex: number;
  share: string;
  packageHash: string;
};

export function splitPackageKey(
  keyBytes: Uint8Array,
  options: {
    planId: string;
    packageHash: string;
    guardianIds: string[];
    threshold: number;
    randomBytes?: (length: number) => Uint8Array;
  }
): GuardianShare[] {
  const shares = splitSecret(keyBytes, options.threshold, options.guardianIds.length, options.randomBytes);

  return shares.map((share, index) => ({
    planId: options.planId,
    guardianId: options.guardianIds[index],
    shareIndex: share.index,
    share: encodeShare(share),
    packageHash: options.packageHash
  }));
}

export function reconstructPackageKey(shares: GuardianShare[], threshold: number): Uint8Array {
  assertThresholdShares(shares, threshold);
  return combineShares(shares.slice(0, threshold).map((share) => decodeShare(share.share)));
}

export function splitSecret(
  secret: Uint8Array,
  threshold: number,
  shareCount: number,
  randomBytes = browserRandomBytes
): Array<{ index: number; bytes: Uint8Array }> {
  if (threshold < 2) {
    throw new Error("Threshold must be at least 2");
  }
  if (shareCount < threshold) {
    throw new Error("Share count must be greater than or equal to threshold");
  }
  if (shareCount > 255) {
    throw new Error("At most 255 shares are supported");
  }

  const shares = Array.from({ length: shareCount }, (_, shareIndex) => ({
    index: shareIndex + 1,
    bytes: new Uint8Array(secret.length)
  }));

  for (let byteIndex = 0; byteIndex < secret.length; byteIndex += 1) {
    const coefficients = new Uint8Array(threshold);
    coefficients[0] = secret[byteIndex];
    coefficients.set(randomBytes(threshold - 1), 1);

    for (const share of shares) {
      share.bytes[byteIndex] = evaluatePolynomial(coefficients, share.index);
    }
  }

  return shares;
}

export function combineShares(shares: Array<{ index: number; bytes: Uint8Array }>): Uint8Array {
  if (shares.length < 2) {
    throw new Error("At least 2 shares are required to reconstruct");
  }

  const byteLength = shares[0].bytes.length;
  const seenIndexes = new Set<number>();
  for (const share of shares) {
    if (share.index < 1 || share.index > 255) {
      throw new Error("Share index must be between 1 and 255");
    }
    if (seenIndexes.has(share.index)) {
      throw new Error("Duplicate share index");
    }
    if (share.bytes.length !== byteLength) {
      throw new Error("All shares must have the same byte length");
    }
    seenIndexes.add(share.index);
  }

  const secret = new Uint8Array(byteLength);
  for (let byteIndex = 0; byteIndex < byteLength; byteIndex += 1) {
    let value = 0;

    for (let i = 0; i < shares.length; i += 1) {
      const xi = shares[i].index;
      let basis = 1;

      for (let j = 0; j < shares.length; j += 1) {
        if (i === j) {
          continue;
        }
        const xj = shares[j].index;
        basis = gfMul(basis, gfDiv(xj, xi ^ xj));
      }

      value ^= gfMul(shares[i].bytes[byteIndex], basis);
    }

    secret[byteIndex] = value;
  }

  return secret;
}

export function encodeShare(share: { index: number; bytes: Uint8Array }): string {
  return `${SHARE_PREFIX}:${share.index}:${toBase64Url(share.bytes)}`;
}

export function decodeShare(encodedShare: string): { index: number; bytes: Uint8Array } {
  const [prefix, rawIndex, rawBytes] = encodedShare.split(":");
  if (prefix !== SHARE_PREFIX || !rawIndex || !rawBytes) {
    throw new Error("Malformed ZecGuard share");
  }

  const index = Number(rawIndex);
  if (!Number.isInteger(index) || index < 1 || index > 255) {
    throw new Error("Invalid ZecGuard share index");
  }

  return { index, bytes: fromBase64Url(rawBytes) };
}

export function assertThresholdShares(shares: GuardianShare[], threshold: number): void {
  if (shares.length < threshold) {
    throw new Error(`Need at least ${threshold} shares to reconstruct`);
  }

  const packageHashes = new Set(shares.map((share) => share.packageHash));
  const planIds = new Set(shares.map((share) => share.planId));
  if (packageHashes.size !== 1 || planIds.size !== 1) {
    throw new Error("Shares must belong to the same plan and package hash");
  }

  for (const share of shares) {
    const decoded = decodeShare(share.share);
    if (decoded.index !== share.shareIndex) {
      throw new Error("Share index does not match encoded share");
    }
  }
}

function evaluatePolynomial(coefficients: Uint8Array, x: number): number {
  let result = 0;
  for (let index = coefficients.length - 1; index >= 0; index -= 1) {
    result = gfMul(result, x) ^ coefficients[index];
  }
  return result;
}

function gfMul(left: number, right: number): number {
  let a = left;
  let b = right;
  let product = 0;

  while (b > 0) {
    if (b & 1) {
      product ^= a;
    }
    a <<= 1;
    if (a & 0x100) {
      a ^= 0x11b;
    }
    b >>= 1;
  }

  return product & 0xff;
}

function gfPow(value: number, power: number): number {
  let result = 1;
  let base = value;
  let exponent = power;

  while (exponent > 0) {
    if (exponent & 1) {
      result = gfMul(result, base);
    }
    base = gfMul(base, base);
    exponent >>= 1;
  }

  return result;
}

function gfDiv(left: number, right: number): number {
  if (right === 0) {
    throw new Error("Division by zero in GF(256)");
  }
  return gfMul(left, gfPow(right, 254));
}

function browserRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const decoded = atob(padded);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }
  return bytes;
}
