import Airtable from "airtable";
import { isEmpty } from "lodash-es";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const { sign, decode, verify } = jwt;

import {
  ICreatePayReq,
  IUserResp,
  IUserLoginRequest,
  IUserRegisterRequest,
} from "./interface";
import { isWaitResults, parseJsonVal } from "./utils";
import { io } from "../index";

const base_id = "appzEYCiuOo01xWiC";

export const dbClient = new Airtable({ apiKey: process.env.API_DB }).base(
  base_id
);

export const createUser = async ({
  name,
  mail,
  pass,
}: IUserRegisterRequest): Promise<string> => {
  const mailFormula = `LOWER({userMail})=LOWER("${mail}")`;
  const nameFormula = `{userName}="${name}"`;

  try {
    const byMail = await dbClient("Users")
      .select({ filterByFormula: mailFormula })
      .all();
    if (!isEmpty(byMail) && !isEmpty(byMail[0]?._rawJson.fields)) {
      throw { message: "Данный e-mail уже зарегистрирован" };
    }

    const byName = await dbClient("Users")
      .select({ filterByFormula: nameFormula })
      .all();
    if (!isEmpty(byName) && !isEmpty(byName[0]?._rawJson.fields)) {
      throw { message: "Имя пользователя занято" };
    }

    return new Promise((res, rej) => {
      const salt = bcrypt.genSaltSync(10);
      dbClient("Users").create(
        {
          userName: name,
          userMail: mail,
          userPass: bcrypt.hashSync(pass, salt),
          tickets: 0,
          role: "user",
          dateCreated: new Date().toISOString(),
        },
        (err, record) => {
          if (err) {
            console.error("createUser err", JSON.stringify(err));
            rej(err);
            return;
          }
          res(record!.getId());
        }
      );
    });
  } catch (e) {
    throw e;
  }
};

export const login = async ({
  mail,
  pass,
}: IUserLoginRequest): Promise<{ token: string; userId: string }> => {
  const mailFormula = `LOWER({userMail})=LOWER("${mail}")`;

  try {
    const byMail = await dbClient("Users")
      .select({ filterByFormula: mailFormula })
      .all();

    const bdEntry = byMail[0]?._rawJson?.fields;

    if (
      isEmpty(byMail[0]) ||
      !bcrypt.compareSync(pass, bdEntry?.["userPass"])
    ) {
      throw { message: "Неверный E-mail или пароль" };
    } else {
      try {
        const token = sign(
          {
            mail: bdEntry["userMail"],
            name: bdEntry["userName"],
          },
          process.env.JWT!,
          { expiresIn: "2h" }
        );
        await dbClient("Users").update(bdEntry["innerId"], {
          lastLogin: new Date().toISOString(),
        });
        return Promise.resolve({
          token,
          userId: byMail[0]._rawJson.id,
        });
      } catch (e) {
        console.log("token_create_err", e?.message);
        throw e;
      }
    }
  } catch (e) {
    throw e;
  }
};

export const getUserProfile = async (user: string): Promise<IUserResp> => {
  try {
    const record = await dbClient("Users").find(user);
    return record._rawJson.fields;
  } catch (e) {
    throw { message: "Ошибка запроса профиля", status: e.statusCode };
  }
};

export const getTableAsArray = <T>(
  tableName: string,
  keysToCheck?: string[],
  filter?: string
): Promise<T> => {
  const final: any[] = [];

  return new Promise((res, rej) => {
    dbClient(tableName)
      .select({
        view: "default",
        ...(filter ? { filterByFormula: filter } : {}),
      })
      .eachPage(
        async (records, fetchNextPage) => {
          records.forEach((record) => {
            let o = {
              ...record._rawJson.fields,
            };
            if (keysToCheck) {
              let shit = keysToCheck.reduce((tot, am) => {
                return {
                  ...tot,
                  [am]: parseJsonVal(tot[am]),
                };
              }, o);
              o = shit;
            }
            final.push(o);
          });
          fetchNextPage();
        },
        (err) => {
          if (err) {
            rej(err);
          }
          res(final as T);
        }
      );
  });
};

export const findEntity = async <T>(
  id: string,
  table: string,
  keysToCheck?: string[]
): Promise<T> => {
  try {
    const record = await dbClient(table).find(id);
    let o = record._rawJson.fields;
    if (keysToCheck) {
      let shit = keysToCheck.reduce((tot, am) => {
        return {
          ...tot,
          [am]: parseJsonVal(tot[am]),
        };
      }, o);
      o = shit;
    }
    return o;
  } catch (e) {
    throw { message: `Не удалось найти ${table}_id` };
  }
};

export const updateUserAfterPayment = async ({ userId, payId }) => {
  try {
    const record = await dbClient("Users").find(userId);
    const { tickets, paymentsArray: arr } = record._rawJson.fields;
    await dbClient("Users").update(userId, {
      tickets: tickets + 1,
      paymentsArray: isEmpty(arr) ? [payId] : [...arr, payId],
    });
    return "success";
  } catch (e) {
    throw { message: "Update тикета не удался", status: e.statusCode };
  }
};

const makeBetDraft = async ({ betBody, game, userId }): Promise<string> => {
  return new Promise((res, rej) => {
    dbClient("Bets").create(
      {
        authorId: userId,
        game,
        betBody,
        forEventName: [],
        dateCreated: new Date().toISOString(),
      },
      (err, record) => {
        if (err) {
          console.error("Bet create err: ", JSON.stringify(err));
          rej(err);
          return;
        }
        res(record!.getId());
      }
    );
  });
};

export const createBet = async ({
  betBody,
  game,
  userId,
  eventId,
}): Promise<string> => {
  let newBetId: string | undefined;
  try {
    newBetId = await makeBetDraft({ betBody, game, userId });
    const record = await dbClient("Events").find(eventId);
    const {
      betsArray: betsInEvent,
      isActive,
      prizePool,
      tourEnd,
    } = record._rawJson.fields;
    let currPrize: number;
    if (isActive && !isWaitResults(tourEnd)) {
      let parsedPool;
      try {
        parsedPool = parseJsonVal(prizePool) ?? {};
        currPrize = parsedPool[game] ?? 0;
      } catch (e) {
        throw { message: "Ошибка парсинга prizePool" };
      }
      try {
        const record = await dbClient("Users").find(userId);
        const { tickets, betsArray: betsInUser } = record._rawJson.fields;
        if (tickets <= 0) {
          throw { message: "0 билетов на балансе" };
        }
        const t = tickets - 1;
        await dbClient("Users").update(userId, {
          betsArray: isEmpty(betsInUser)
            ? [newBetId]
            : [...betsInUser, newBetId],
          tickets: t,
        });
      } catch (e) {
        throw e;
      }
      try {
        await dbClient("Events").update(eventId, {
          betsArray: isEmpty(betsInEvent)
            ? [newBetId]
            : [...betsInEvent, newBetId],
          prizePool: JSON.stringify({
            ...(parsedPool ?? {}),
            [game]: currPrize + 300,
          }),
        });
        io.in(`event-${eventId}`).emit("betUpdateResponse", {
          updVal: currPrize + 300,
          game,
        });
        return newBetId;
      } catch {
        throw { message: "Update События провален" };
      }
    } else {
      throw { message: "Ставка подана на неактивное событие" };
    }
  } catch (e) {
    return new Promise((res, rej) => {
      if (newBetId) {
        dbClient("Bets").destroy([newBetId], (err, deletedRecords) => {
          if (err) {
            rej(err);
          }
          res(`Deleted betDraft because of EventUpdate Errors`);
        });
      }
      rej(e);
    });
  }
};

export const createPayment = async ({
  amount,
  withdraw_amount,
  userId,
  comment,
}: ICreatePayReq): Promise<string> => {
  return new Promise((res, rej) => {
    dbClient("Payments").create(
      {
        authorId: userId,
        paymentInfo: `${withdraw_amount}_${amount}${
          comment ? `_com: ${comment}` : ""
        }`,
        dateCreated: new Date().toISOString(),
      },
      (err, record) => {
        if (err) {
          console.error("Bet create err: ", JSON.stringify(err));
          rej(err);
          return;
        }
        res(record!.getId());
      }
    );
  });
};
