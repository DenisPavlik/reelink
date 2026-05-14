import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { FriendlyError } from "./errors";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_TEXT_LENGTH = 8000;
const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";

export type ExtractedArticle = {
  title: string;
  text: string;
};

export async function extractArticle(url: string): Promise<ExtractedArticle> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new FriendlyError("That doesn't look like a valid URL.");
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new FriendlyError("Only http(s) URLs are supported.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let html: string;
  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: { "user-agent": DESKTOP_UA, accept: "text/html,*/*" },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!response.ok) {
      throw new FriendlyError(
        "Couldn't read that article — try a different URL.",
      );
    }
    html = await response.text();
  } catch (cause) {
    clearTimeout(timeoutId);
    if (cause instanceof FriendlyError) throw cause;
    throw new FriendlyError(
      "Couldn't read that article — try a different URL.",
      cause,
    );
  }
  clearTimeout(timeoutId);

  let parsed: { title: string | null; textContent: string | null } | null;
  try {
    const dom = new JSDOM(html, { url: parsedUrl.toString() });
    parsed = new Readability(dom.window.document).parse();
  } catch (cause) {
    throw new FriendlyError(
      "Couldn't read that article — try a different URL.",
      cause,
    );
  }

  const title = parsed?.title?.trim();
  const text = parsed?.textContent?.replace(/\s+/g, " ").trim();
  if (!title || !text || text.length < 100) {
    throw new FriendlyError(
      "Couldn't read that article — try a different URL.",
    );
  }

  return {
    title,
    text: text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text,
  };
}
