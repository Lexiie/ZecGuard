export const ZECGUARD_MEMO_PREFIX = "ZECGUARD:v0";

export function assertZecGuardMemo(memo: string): void {
  if (!memo.trim().startsWith(ZECGUARD_MEMO_PREFIX)) {
    throw new Error("Memo must start with ZECGUARD:v0");
  }
}
