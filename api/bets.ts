import { findEntity, getTableAsArray } from "./airtable";
import { IBetResponse } from "./interface";
import { betResKeysCheck } from "./utils";

export const getBets = async (req, res) => {
  const { user } = req.query;
  const nameFormula = `{authorId}="${user}"`;

  try {
    let result = await getTableAsArray<IBetResponse[]>(
      "Bets",
      betResKeysCheck,
      nameFormula
    );
    res.send(result);
  } catch (err) {
    res.json(err);
  }
};

export const getSingleBet = async (req, res) => {
  const { id } = req.params;

  try {
    let result = await findEntity<IBetResponse>(id, "Bets", betResKeysCheck);
    res.send(result);
  } catch (err) {
    res.json(err);
  }
};
