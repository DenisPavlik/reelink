import { config } from "dotenv";
config({ path: ".env.local" });

import { addSpent, getSpent, isPaused, reset } from "../lib/budget";
import { kv } from "../lib/kv";

async function main() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error("Set KV_REST_API_URL + KV_REST_API_TOKEN in .env.local first.");
    process.exit(1);
  }

  console.log("Resetting counter...");
  await reset();
  let spent = await getSpent();
  console.log(`spent: ${spent} (expected 0)`);

  console.log("Setting spend to 1499 cents...");
  await kv().set("reelink:spent_cents", 1499);
  let paused = await isPaused();
  console.log(`isPaused: ${paused} (expected false)`);

  console.log("addSpent(1)...");
  await addSpent(1);
  spent = await getSpent();
  paused = await isPaused();
  console.log(`spent: ${spent} (expected 1500), isPaused: ${paused} (expected true)`);

  console.log("Resetting...");
  await reset();
  spent = await getSpent();
  console.log(`spent: ${spent} (expected 0)`);

  console.log("\nAll checks done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
