import { config } from "dotenv";
config({ path: ".env.local" });

import {
  IAMClient,
  CreateRoleCommand,
  PutRolePolicyCommand,
  GetRoleCommand,
} from "@aws-sdk/client-iam";

const ROLE_NAME = "remotion-lambda-role";
const POLICY_NAME = "remotion-lambda-role-policy";

const TRUST_POLICY = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Principal: { Service: "lambda.amazonaws.com" },
      Action: "sts:AssumeRole",
    },
  ],
};

const INLINE_POLICY = {
  Version: "2012-10-17",
  Statement: [
    {
      Sid: "0",
      Effect: "Allow",
      Action: ["s3:ListAllMyBuckets"],
      Resource: ["*"],
    },
    {
      Sid: "1",
      Effect: "Allow",
      Action: [
        "s3:CreateBucket",
        "s3:ListBucket",
        "s3:PutBucketAcl",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl",
        "s3:PutObject",
        "s3:GetBucketLocation",
      ],
      Resource: ["arn:aws:s3:::remotionlambda-*"],
    },
    {
      Sid: "2",
      Effect: "Allow",
      Action: ["lambda:InvokeFunction"],
      Resource: ["arn:aws:lambda:*:*:function:remotion-render-*"],
    },
    {
      Sid: "3",
      Effect: "Allow",
      Action: ["logs:CreateLogGroup"],
      Resource: ["arn:aws:logs:*:*:log-group:/aws/lambda-insights"],
    },
    {
      Sid: "4",
      Effect: "Allow",
      Action: ["logs:CreateLogStream", "logs:PutLogEvents"],
      Resource: [
        "arn:aws:logs:*:*:log-group:/aws/lambda/remotion-render-*",
        "arn:aws:logs:*:*:log-group:/aws/lambda-insights:*",
      ],
    },
  ],
};

async function main() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("Missing AWS credentials in .env.local");
    process.exit(1);
  }

  const iam = new IAMClient({ region: process.env.AWS_REGION ?? "us-east-1" });

  try {
    await iam.send(new GetRoleCommand({ RoleName: ROLE_NAME }));
    console.log(`Role "${ROLE_NAME}" already exists — updating policy.`);
  } catch (err: unknown) {
    if ((err as { name?: string }).name === "NoSuchEntityException") {
      console.log(`Creating role "${ROLE_NAME}"...`);
      await iam.send(
        new CreateRoleCommand({
          RoleName: ROLE_NAME,
          AssumeRolePolicyDocument: JSON.stringify(TRUST_POLICY),
          Description: "Role assumed by Remotion Lambda render functions.",
        }),
      );
      console.log("Role created.");
    } else {
      throw err;
    }
  }

  console.log(`Attaching inline policy "${POLICY_NAME}"...`);
  await iam.send(
    new PutRolePolicyCommand({
      RoleName: ROLE_NAME,
      PolicyName: POLICY_NAME,
      PolicyDocument: JSON.stringify(INLINE_POLICY),
    }),
  );

  console.log("Done. IAM propagation can take ~10 seconds.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
