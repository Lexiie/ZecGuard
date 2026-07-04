import { spawn } from "node:child_process";

type CommandResult = {
  stdout: string;
  stderr: string;
};

const zingoCli = process.env.ZECGUARD_ZINGO_CLI ?? "zingo-cli";

export async function checkZingo(): Promise<CommandResult> {
  return runZingo(["--version"]);
}

export async function sendMemo(to: string, amount: string, memo: string): Promise<CommandResult> {
  return runZingo(["quicksend", to, zecToZatoshis(amount), memo]);
}

export async function listMemos(): Promise<CommandResult> {
  return runZingo(["messages", "ZECGUARD:v0"]);
}

export async function getTransaction(txid: string): Promise<CommandResult> {
  const result = await runZingo(["transactions"]);
  return {
    ...result,
    stdout: result.stdout.includes(txid) ? result.stdout : `Requested txid ${txid} was not found in wallet transactions.\n\n${result.stdout}`
  };
}

export async function syncWallet(): Promise<CommandResult> {
  return runZingo(["sync", "run"]);
}

export function zecToZatoshis(amount: string): string {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d{1,8})?$/.test(trimmed)) {
    throw new Error("Amount must be a non-negative ZEC value with at most 8 decimal places");
  }

  const [whole, fraction = ""] = trimmed.split(".");
  const zatoshis = BigInt(whole) * 100_000_000n + BigInt(fraction.padEnd(8, "0"));
  if (zatoshis <= 0n) {
    throw new Error("Amount must be greater than zero");
  }
  return zatoshis.toString();
}

function runZingo(args: string[]): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(zingoCli, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(new Error(`Unable to run ${zingoCli}: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(stderr || `${zingoCli} exited with code ${code}`));
    });
  });
}
