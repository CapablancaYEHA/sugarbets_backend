import crypto from "crypto";
import { IBetBod, IWebhookReq } from "./interface";

export const parseJsonVal = (arg: string) => {
  try {
    const newVal = JSON.parse(arg);
    return newVal;
  } catch (e) {
    return null;
  }
};

export const eventResKeysCheck = ["games", "prizePool", "masterBetbody"];
export const betResKeysCheck = ["betBody"];

const paramsArr = [
  "notification_type",
  "operation_id",
  "amount",
  "currency",
  "datetime",
  "sender",
  "codepro",
];

export const compareSha = (inp: IWebhookReq, label, example: string) => {
  const draft = paramsArr
    .map((p) => String(inp[p]))
    .concat([process.env.YOO_SEC!, label])
    .join("&");

  const hash = crypto.createHash("sha1");
  hash.update(draft);
  return hash.digest("hex") === example;
};

const sequence = ["1", "2", "3", "4", "56", "78"];

export const compareHashTables = (master: IBetBod, example: IBetBod) => {
  let shit = sequence.map((a) => {
    if (a === "56" || a === "78") {
      return JSON.stringify(example[a]) === JSON.stringify(master[a]);
    }
    return example[a] === master[a];
  });
  return shit.every((b) => b);
};
