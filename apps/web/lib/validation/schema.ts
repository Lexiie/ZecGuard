import { z } from "zod";

export const guardianSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  zcashAddress: z.string().min(1),
  inviteTxid: z.string().optional(),
  ackTxid: z.string().optional(),
  status: z.enum(["not_invited", "invite_generated", "invite_sent", "invite_txid_recorded", "ack_pending", "ack_received", "failed"])
});

export const recoveryPlanSchema = z.object({
  id: z.string().startsWith("zg_plan_"),
  version: z.literal("0.1"),
  name: z.string().min(1),
  walletType: z.string().min(1),
  ownerAlias: z.string().min(1),
  threshold: z.number().int().min(2),
  totalGuardians: z.number().int().min(3),
  createdAt: z.string().datetime(),
  packageHash: z.string().optional(),
  status: z.enum(["draft", "encrypted", "invites_sent", "ready", "drill_complete"])
});

export type Guardian = z.infer<typeof guardianSchema>;
export type RecoveryPlan = z.infer<typeof recoveryPlanSchema>;
