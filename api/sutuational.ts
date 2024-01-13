import { Request } from "express";
import { createBet, getTableAsArray } from "./airtable";
import { ICreateBetReq } from "./interface";

// Если ответ предполагается не стринга\json (а число например), то его нельзя просто так отправить, нужно преобразовать в json
const tableByGame = {
  T8: "Tek",
  SF6: "Street",
};

export const getPlayers = async (req, res) => {
  const { game, locale } = req.query;
  try {
    let result = await getTableAsArray(
      `Players${tableByGame[game]}${locale.toUpperCase()}`
    );
    res.send(result);
  } catch (err) {
    res.json(err);
  }
};

export const postBet = async (req: Request<{}, {}, ICreateBetReq>, res) => {
  const { betBody, game, userId, eventId } = req.body;

  try {
    let result = await createBet({ betBody, game, userId, eventId });
    res.status(201).send(result);
  } catch (err) {
    res.status(err?.status ?? 418).json(err);
  }
};

export const pingTable = () =>
  new Promise(async (res, rej) => {
    try {
      await getTableAsArray("PlayersTekRU");
      res("1");
    } catch (e) {
      res("fail");
    }
  });
