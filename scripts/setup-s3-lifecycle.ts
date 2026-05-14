import { config } from "dotenv";
config({ path: ".env.local" });

import {
  S3Client,
  PutBucketLifecycleConfigurationCommand,
} from "@aws-sdk/client-s3";

const BUCKET = "remotionlambda-useast1-t4c8b5bjz3";

async function main() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("Missing AWS credentials in .env.local");
    process.exit(1);
  }

  const s3 = new S3Client({ region: process.env.AWS_REGION ?? "us-east-1" });

  console.log(`Setting 7-day expiration lifecycle on s3://${BUCKET}/renders/...`);
  await s3.send(
    new PutBucketLifecycleConfigurationCommand({
      Bucket: BUCKET,
      LifecycleConfiguration: {
        Rules: [
          {
            ID: "reelink-renders-7d",
            Status: "Enabled",
            Filter: { Prefix: "renders/" },
            Expiration: { Days: 7 },
          },
        ],
      },
    }),
  );
  console.log("Done. Render outputs will auto-delete after 7 days.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
