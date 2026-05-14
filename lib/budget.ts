import { kv } from "./kv";
import { sendAlert } from "./alerts";

const KEY_SPENT = "reelink:spent_cents";
const KEY_ALERTED_10 = "reelink:alerted_10";
const KEY_ALERTED_14 = "reelink:alerted_14";

export const CAP_CENTS = 1500;
export const WARN_CENTS = 1000;
export const CRITICAL_CENTS = 1400;

export async function getSpent(): Promise<number> {
  const value = await kv().get<number>(KEY_SPENT);
  return value ?? 0;
}

export async function isPaused(): Promise<boolean> {
  return (await getSpent()) >= CAP_CENTS;
}

export async function addSpent(cents: number): Promise<number> {
  const total = await kv().incrby(KEY_SPENT, cents);
  await maybeAlert(total);
  return total;
}

export async function reset(): Promise<void> {
  await kv().del(KEY_SPENT, KEY_ALERTED_10, KEY_ALERTED_14);
}

export type BudgetStatus = {
  spentCents: number;
  capCents: number;
  remainingCents: number;
  paused: boolean;
};

export async function getStatus(): Promise<BudgetStatus> {
  const spent = await getSpent();
  return {
    spentCents: spent,
    capCents: CAP_CENTS,
    remainingCents: Math.max(0, CAP_CENTS - spent),
    paused: spent >= CAP_CENTS,
  };
}

async function maybeAlert(total: number): Promise<void> {
  const client = kv();
  if (total >= CRITICAL_CENTS) {
    const alerted = await client.get<number>(KEY_ALERTED_14);
    if (!alerted) {
      await client.set(KEY_ALERTED_14, 1);
      await sendAlert(
        "critical",
        `Spent ${total / 100} of $${CAP_CENTS / 100}. Approaching kill-switch.`,
      );
    }
  } else if (total >= WARN_CENTS) {
    const alerted = await client.get<number>(KEY_ALERTED_10);
    if (!alerted) {
      await client.set(KEY_ALERTED_10, 1);
      await sendAlert(
        "warn",
        `Spent $${total / 100} of $${CAP_CENTS / 100}. Watch the counter.`,
      );
    }
  }
}
