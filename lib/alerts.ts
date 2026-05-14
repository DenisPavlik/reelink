export type AlertLevel = "warn" | "critical";

export async function sendAlert(
  level: AlertLevel,
  message: string,
): Promise<void> {
  const prefix = level === "critical" ? "[budget-critical]" : "[budget-warn]";
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) {
    if (level === "critical") console.error(`${prefix} ${message}`);
    else console.warn(`${prefix} ${message}`);
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: `${prefix} ${message}` }),
    });
  } catch (cause) {
    console.error(`${prefix} (webhook failed) ${message}`, cause);
  }
}
