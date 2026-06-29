export function createPlanId(random = crypto.getRandomValues(new Uint8Array(12))): string {
  return `zg_plan_${Array.from(random, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
