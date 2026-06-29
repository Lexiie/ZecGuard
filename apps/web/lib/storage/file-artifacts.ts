"use client";

export function downloadJson(filename: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function readJsonFile<T>(file: File): Promise<T> {
  return JSON.parse(await file.text()) as T;
}

export function safeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}
