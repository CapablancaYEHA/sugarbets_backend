import { Request } from "express";
import { createBet, getTableAsArray, getUserTickets } from "./airtable";
import { ICreateBetReq } from "./interface";

export const getPlayers = async (req, res) => {
  try {
    let result = await getTableAsArray("Players");
    res.send(result);
  } catch (err) {
    res.json(err);
  }
};

// Если ответ предполагается не стринга\json, то его нельзя просто так отправить, нужно преобразовать в json
export const getTickets = async (req, res) => {
  let { user } = req.query;
  try {
    let result = await getUserTickets(user as string);
    res.json(result);
  } catch (err) {
    res.status(err?.status || 500).json(err);
  }
};

export const getBets = async (req, res) => {
  try {
    let result = await getTableAsArray("Bets");
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
