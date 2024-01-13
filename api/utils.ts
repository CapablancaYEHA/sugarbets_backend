import crypto from "crypto";
import { compareAsc } from "date-fns/compareAsc";
import { parseISO } from "date-fns/parseISO";
import { IWebhookReq } from "./interface";

export const isWaitResults = (tourEnd: string) => {
  const end = parseISO(tourEnd);
  return compareAsc(new Date(), end) === 1;
};

export const parseJsonVal = (arg: string) => {
  try {
    const newVal = JSON.parse(arg);
    return newVal;
  } catch (e) {
    return null;
  }
};

export const eventResKeysCheck = [
  "games",
  "prizePool",
  "masterBetbody",
  "winners",
];
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

// OLD
// export const compareHashTables = (master: IBetBod, example: IBetBod) => {
//   let shit = sequence.map((a) => {
//     if (a === "56" || a === "78") {
//       return JSON.stringify(example[a]) === JSON.stringify(master[a]);
//     }
//     return example[a] === master[a];
//   });
//   return shit.every((b) => b);
// };

export const compareHashTables = (example, master) => {
  let result: boolean[] | boolean = [];
  for (let i = 0; i <= sequence.length - 1; i++) {
    if (sequence[i] === "56" || sequence[i] === "78") {
      if (
        JSON.stringify(example[sequence[i]]) ===
        JSON.stringify(master[sequence[i]])
      ) {
        result.push(true);
      } else {
        result = false;
        break;
      }
    } else {
      if (example[sequence[i]] === master[sequence[i]]) {
        result.push(true);
      } else {
        result = false;
        break;
      }
    }
  }
  return Array.isArray(result) ? result.every((b) => b) : result;
};
