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
  return runZingo(["send", to, amount, memo]);
}

export async function listMemos(): Promise<CommandResult> {
  return runZingo(["memos"]);
}

export async function getTransaction(txid: string): Promise<CommandResult> {
  return runZingo(["transaction", txid]);
}

export async function syncWallet(): Promise<CommandResult> {
  return runZingo(["sync"]);
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
