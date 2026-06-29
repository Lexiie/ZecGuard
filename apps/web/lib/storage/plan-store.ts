"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EncryptedPackage } from "@/lib/crypto/encrypt";
import type { GuardianShare } from "@/lib/crypto/shamir";

export type GuardianStatus =
  | "not_invited"
  | "invite_generated"
  | "invite_sent"
  | "invite_txid_recorded"
  | "ack_pending"
  | "ack_received"
  | "failed";

export type RecoveryPlanDraft = {
  id: string;
  version: "0.1";
  name: string;
  ownerAlias: string;
  walletType: string;
  recoveryInstructions: string;
  emergencyNote: string;
  dummySecret: string;
  threshold: number;
  totalGuardians: number;
  createdAt: string;
  packageHash?: string;
  status: "draft" | "encrypted" | "invites_sent" | "ready" | "drill_complete";
};

export type GuardianDraft = {
  id: string;
  name: string;
  zcashAddress: string;
  inviteTxid?: string;
  ackTxid?: string;
  status: GuardianStatus;
};

export type MemoRecord = {
  id: string;
  planId: string;
  guardianId?: string;
  type: "GUARDIAN_INVITE" | "GUARDIAN_ACK" | "PACKAGE_ANCHOR";
  memo: string;
  txid?: string;
  direction: "owner_to_guardian" | "guardian_to_owner" | "owner_anchor";
  status: "generated" | "sent" | "recorded";
  createdAt: string;
};

type PlanState = {
  plan: RecoveryPlanDraft | null;
  guardians: GuardianDraft[];
  encryptedPackage: EncryptedPackage | null;
  shares: GuardianShare[];
  memoRecords: MemoRecord[];
  setPlan: (plan: RecoveryPlanDraft) => void;
  setGuardians: (guardians: GuardianDraft[]) => void;
  setPackageArtifacts: (input: { encryptedPackage: EncryptedPackage; shares: GuardianShare[]; packageHash: string }) => void;
  upsertMemoRecord: (record: MemoRecord) => void;
  updateGuardian: (guardianId: string, patch: Partial<GuardianDraft>) => void;
  reset: () => void;
};

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plan: null,
      guardians: defaultGuardians(),
      encryptedPackage: null,
      shares: [],
      memoRecords: [],
      setPlan: (plan) => set({ plan }),
      setGuardians: (guardians) => set({ guardians }),
      setPackageArtifacts: ({ encryptedPackage, shares, packageHash }) =>
        set((state) => ({
          encryptedPackage,
          shares,
          plan: state.plan ? { ...state.plan, packageHash, status: "encrypted" } : state.plan
        })),
      upsertMemoRecord: (record) =>
        set((state) => ({
          memoRecords: [...state.memoRecords.filter((existing) => existing.id !== record.id), record]
        })),
      updateGuardian: (guardianId, patch) =>
        set((state) => ({
          guardians: state.guardians.map((guardian) => (guardian.id === guardianId ? { ...guardian, ...patch } : guardian))
        })),
      reset: () =>
        set({
          plan: null,
          guardians: defaultGuardians(),
          encryptedPackage: null,
          shares: [],
          memoRecords: []
        })
    }),
    {
      name: "zecguard:mvp-plan"
    }
  )
);

export function defaultGuardians(): GuardianDraft[] {
  return [1, 2, 3].map((index) => ({
    id: `g${index}`,
    name: `Guardian ${index}`,
    zcashAddress: "",
    status: "not_invited"
  }));
}
