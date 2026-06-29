import cors from "@fastify/cors";
import Fastify from "fastify";
import { z } from "zod";
import { assertZecGuardMemo } from "./memo.js";
import { checkZingo, getTransaction, listMemos, sendMemo, syncWallet } from "./zingo.js";

const host = process.env.ZECGUARD_BRIDGE_HOST ?? "127.0.0.1";
const port = Number(process.env.ZECGUARD_BRIDGE_PORT ?? 8787);

const sendMemoSchema = z.object({
  to: z.string().min(1),
  amount: z.string().min(1).default("0.0001"),
  memo: z.string().min(1)
});

const server = Fastify({ logger: true });

await server.register(cors, {
  origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/]
});

server.get("/health", async () => {
  try {
    const zingo = await checkZingo();
    return { ok: true, bridge: "zecguard", wallet: "available", zingo };
  } catch (error) {
    return { ok: true, bridge: "zecguard", wallet: "unavailable", error: errorMessage(error) };
  }
});

server.post("/wallet/send-memo", async (request, reply) => {
  const body = sendMemoSchema.parse(request.body);
  assertZecGuardMemo(body.memo);

  try {
    const result = await sendMemo(body.to, body.amount, body.memo);
    return { ok: true, txid: result.stdout.trim(), raw: result };
  } catch (error) {
    reply.code(502);
    return { ok: false, error: errorMessage(error) };
  }
});

server.get("/wallet/memos", async (_request, reply) => {
  try {
    const result = await listMemos();
    return { ok: true, raw: result };
  } catch (error) {
    reply.code(502);
    return { ok: false, error: errorMessage(error) };
  }
});

server.get("/wallet/tx/:txid", async (request, reply) => {
  const { txid } = z.object({ txid: z.string().min(1) }).parse(request.params);
  try {
    const result = await getTransaction(txid);
    return { ok: true, txid, raw: result };
  } catch (error) {
    reply.code(502);
    return { ok: false, error: errorMessage(error) };
  }
});

server.post("/wallet/sync", async (_request, reply) => {
  try {
    const result = await syncWallet();
    return { ok: true, raw: result };
  } catch (error) {
    reply.code(502);
    return { ok: false, error: errorMessage(error) };
  }
});

server.listen({ host, port }).catch((error) => {
  server.log.error(error);
  process.exit(1);
});

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown bridge error";
}
