import { config } from "dotenv";
config({ path: ".env.local" });

import { extractArticle } from "../lib/extract-article";
import { generateScript } from "../lib/generate-script";
import { isFriendlyError } from "../lib/errors";

const URLS = [
  "https://blog.codinghorror.com/the-best-code-is-no-code-at-all/",
  "https://overreacted.io/the-two-reacts/",
  "https://en.wikipedia.org/wiki/Short-form_video",
];

function wordCount(s: string): number {
  return s.trim().split(/\s+/).length;
}

function hasEmoji(s: string): boolean {
  return /\p{Extended_Pictographic}/u.test(s);
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set — add it to .env.local first.");
    process.exit(1);
  }

  for (const url of URLS) {
    console.log(`\n=== ${url}`);
    try {
      const article = await extractArticle(url);
      const script = await generateScript(article);
      console.log(`title: ${script.title}`);
      console.log(`scenes: ${script.scenes.length}`);
      script.scenes.forEach((s, i) => {
        const words = wordCount(s.text);
        const emoji = hasEmoji(s.text) ? " [EMOJI!]" : "";
        const tooLong = words > 25 ? ` [${words} WORDS — TOO LONG]` : "";
        console.log(`  ${i + 1}. (${words}w) ${s.text}${emoji}${tooLong}`);
      });
    } catch (e) {
      if (isFriendlyError(e)) {
        console.log(`friendly error: ${e.userMessage}`);
      } else {
        console.log(`unexpected error:`, e);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
