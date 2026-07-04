export const ZECGUARD_MEMO_PREFIX = "ZECGUARD:v0";

export const memoTypes = ["GUARDIAN_INVITE", "GUARDIAN_ACK", "PACKAGE_ANCHOR"] as const;

export type ZecGuardMemoType = (typeof memoTypes)[number];

export type ZecGuardMemo = {
  type: ZecGuardMemoType;
  plan_id: string;
  guardian_id?: string;
  threshold?: string;
  package_hash: string;
  reply_to?: string;
  note?: string;
  status?: string;
  version?: string;
};

export type ZecGuardMemoScanResult = {
  memo: ZecGuardMemo;
  payload: string;
};

const requiredFieldsByType: Record<ZecGuardMemoType, Array<keyof ZecGuardMemo>> = {
  GUARDIAN_INVITE: ["type", "plan_id", "guardian_id", "threshold", "package_hash", "reply_to"],
  GUARDIAN_ACK: ["type", "plan_id", "guardian_id", "package_hash", "status"],
  PACKAGE_ANCHOR: ["type", "plan_id", "package_hash", "version"]
};

export function formatZecGuardMemo(memo: ZecGuardMemo): string {
  validateMemo(memo);

  const orderedEntries: Array<[string, string | undefined]> = [
    ["type", memo.type],
    ["plan_id", memo.plan_id],
    ["guardian_id", memo.guardian_id],
    ["threshold", memo.threshold],
    ["package_hash", memo.package_hash],
    ["reply_to", memo.reply_to],
    ["note", memo.note],
    ["status", memo.status],
    ["version", memo.version]
  ];

  return [ZECGUARD_MEMO_PREFIX, ...orderedEntries.filter(([, value]) => value).map(([key, value]) => `${key}:${value}`)].join("\n");
}

export function parseZecGuardMemo(input: string): ZecGuardMemo {
  const lines = input.trim().split(/\r?\n/);
  if (lines[0] !== ZECGUARD_MEMO_PREFIX) {
    throw new Error("Invalid ZecGuard memo prefix");
  }

  const fields = Object.fromEntries(
    lines.slice(1).map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex <= 0) {
        throw new Error(`Malformed memo line: ${line}`);
      }
      return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
    })
  ) as Partial<ZecGuardMemo>;

  if (!fields.type || !isMemoType(fields.type)) {
    throw new Error("Unsupported ZecGuard memo type");
  }

  const memo = fields as ZecGuardMemo;
  validateMemo(memo);
  return memo;
}

export function scanZecGuardMemos(input: unknown): ZecGuardMemoScanResult[] {
  const payloads = new Map<string, string>();

  for (const candidate of collectMemoCandidateStrings(input)) {
    for (const payload of extractMemoPayloads(candidate)) {
      payloads.set(payload, payload);
    }
  }

  return [...payloads.values()].flatMap((payload) => {
    try {
      return [{ memo: parseZecGuardMemo(payload), payload }];
    } catch {
      return [];
    }
  });
}

export function validateMemo(memo: ZecGuardMemo): void {
  if (!isMemoType(memo.type)) {
    throw new Error("Unsupported ZecGuard memo type");
  }

  for (const field of requiredFieldsByType[memo.type]) {
    if (!memo[field]) {
      throw new Error(`Missing memo field: ${String(field)}`);
    }
  }
}

function isMemoType(value: string): value is ZecGuardMemoType {
  return (memoTypes as readonly string[]).includes(value);
}

function collectMemoCandidateStrings(input: unknown): string[] {
  if (typeof input !== "string") {
    if (input && typeof input === "object") {
      return Object.values(input).flatMap((value) => collectMemoCandidateStrings(value));
    }
    return [];
  }

  const candidates = [input];
  try {
    candidates.push(...collectMemoCandidateStrings(JSON.parse(input)));
  } catch {
    // Raw wallet output is often plain text, not JSON.
  }
  return candidates;
}

function extractMemoPayloads(candidate: string): string[] {
  const normalized = candidate.includes(`${ZECGUARD_MEMO_PREFIX}\n`) ? candidate : candidate.replaceAll("\\r\\n", "\n").replaceAll("\\n", "\n");
  const lines = normalized.replaceAll("\r\n", "\n").split("\n");
  const payloads: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].trim() !== ZECGUARD_MEMO_PREFIX) {
      continue;
    }

    const payloadLines = [ZECGUARD_MEMO_PREFIX];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor].trim();
      if (!line || line === ZECGUARD_MEMO_PREFIX) {
        break;
      }
      if (!isKnownMemoLine(line)) {
        break;
      }
      payloadLines.push(line);
    }

    payloads.push(payloadLines.join("\n"));
  }

  return payloads;
}

function isKnownMemoLine(line: string): boolean {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex <= 0) {
    return false;
  }
  return ["type", "plan_id", "guardian_id", "threshold", "package_hash", "reply_to", "note", "status", "version"].includes(line.slice(0, separatorIndex));
}
