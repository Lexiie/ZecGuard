export type BridgeHealth = {
  ok: boolean;
  bridge: string;
  wallet: "available" | "unavailable";
  error?: string;
};

export type SendMemoInput = {
  to: string;
  amount: string;
  memo: string;
};

export type SendMemoResult = {
  ok: boolean;
  txid?: string;
  error?: string;
};

const bridgeBaseUrl = process.env.NEXT_PUBLIC_ZECGUARD_BRIDGE_URL ?? "http://127.0.0.1:8787";

export async function getBridgeHealth(): Promise<BridgeHealth> {
  const response = await fetch(`${bridgeBaseUrl}/health`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Bridge health check failed: ${response.status}`);
  }
  return response.json() as Promise<BridgeHealth>;
}

export async function sendMemoWithBridge(input: SendMemoInput): Promise<SendMemoResult> {
  const response = await fetch(`${bridgeBaseUrl}/wallet/send-memo`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });

  const body = (await response.json()) as SendMemoResult;
  if (!response.ok || !body.ok) {
    return { ok: false, error: body.error ?? `Bridge send failed: ${response.status}` };
  }

  return body;
}
