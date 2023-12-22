import Airtable from "airtable";
import { isEmpty } from "lodash-es";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const { sign, decode, verify } = jwt;

import { IUserLoginRequest, IUserRegisterRequest } from "./interface";

const base_id = "appzEYCiuOo01xWiC";

export const dbClient = new Airtable({ apiKey: process.env.API_DB }).base(
  base_id
);

export const createUser = async ({
  name,
  mail,
  pass,
}: IUserRegisterRequest): Promise<string> => {
  const mailFormula = `{userMail}="${mail}"`;
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
          role: "user",
        },
        (err, record) => {
          if (err) {
            console.error(" createUser err", JSON.stringify(err));
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
}: IUserLoginRequest): Promise<string> => {
  const mailFormula = `{userMail}="${mail}"`;

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
        return Promise.resolve(token);
      } catch (e) {
        console.log("token_create_err", e?.message);
        throw e;
      }
    }
  } catch (e) {
    throw e;
  }
};

export const getBetsList = () => {
  const final: any[] = [];

  return new Promise((res, rej) => {
    dbClient("Bet")
      .select()
      .eachPage(
        (records, fetchNextPage) => {
          records.forEach((record) => {
            const o = {
              id: record._rawJson.id,
              ...record._rawJson.fields,
            };
            final.push(o);
          });
          fetchNextPage();
          res(final);
        },
        (err) => {
          if (err) {
            rej(err);
          }
        }
      );
  });
};

export const findBet = async (id: string) => {
  try {
    const record = await dbClient("Bet").find(id);
    return record._rawJson.fields;
  } catch (e) {
    console.log("bet search err", e);
  }
};

export const sendBetAmount = async (amount: number, id: string) => {
  try {
    let newValue: number;
    const record = await dbClient("Bet").find(id);
    newValue = record._rawJson.fields.betTotal + amount;
    await dbClient("Bet").update(id, {
      betTotal: newValue,
    });
    console.log("Succ update!");
    return newValue;
  } catch (e) {
    console.log("bet update err", e);
  }
};
