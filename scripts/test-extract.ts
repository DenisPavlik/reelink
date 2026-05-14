import { extractArticle } from "../lib/extract-article";
import { isFriendlyError } from "../lib/errors";

const URLS = [
  "https://blog.codinghorror.com/the-best-code-is-no-code-at-all/",
  "https://overreacted.io/the-two-reacts/",
  "https://en.wikipedia.org/wiki/Short-form_video",
];

async function main() {
  for (const url of URLS) {
    console.log(`\n=== ${url}`);
    try {
      const article = await extractArticle(url);
      console.log(`title: ${article.title}`);
      console.log(`length: ${article.text.length} chars`);
      console.log(`preview: ${article.text.slice(0, 240)}…`);
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
