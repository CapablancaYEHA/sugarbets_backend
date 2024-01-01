import crypto from "crypto";
import { IWebhookReq } from "./interface";

export const parseJsonVal = (arg: string) => {
  try {
    const newVal = JSON.parse(arg);
    return newVal;
  } catch (e) {
    return null;
  }
};

export const betsResponseKeysCheck = ["games", "prizePool"];

const paramsArr = [
  "notification_type",
  "operation_id",
  "amount",
  "currency",
  "datetime",
  "sender",
  "codepro",
  "notification_secret",
  "label",
];

export const compareSha = (inp: IWebhookReq, example: string) => {
  const draft = paramsArr
    .map((p) => String(inp[p]))
    .concat([process.env.YOO_SEC!])
    .join("$");

  const hash = crypto.createHash("sha1");
  hash.update(draft);
  return hash.digest("hex") === example;
};
