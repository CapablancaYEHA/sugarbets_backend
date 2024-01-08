import { isEmpty } from "lodash-es";
import { dbClient, findEntity, getTableAsArray } from "./airtable";
import {
  betResKeysCheck,
  compareHashTables,
  eventResKeysCheck,
  parseJsonVal,
} from "./utils";
import { IBetResponse, IEventsResponse, IUserResp } from "./interface";

export const getEvents = async (req, res) => {
  try {
    let result = await getTableAsArray<IEventsResponse[]>(
      "Events",
      eventResKeysCheck
    );
    res.send(result);
  } catch (err) {
    res.status(err?.status || 500).json(err);
  }
};

export const getSingleEvent = async (req, res) => {
  try {
    let result = await findEntity<IEventsResponse>(
      req.params.id,
      "Events",
      eventResKeysCheck
    );
    res.send(result);
  } catch (err) {
    res.status(err?.status || 500).json(err);
  }
};

export const closeEvent = async (req, res) => {
  const { betBody, eventId, game } = req.body;

  try {
    const allBets = await getTableAsArray<IBetResponse[]>(
      "Bets",
      betResKeysCheck
    );

    const relevantBets = allBets.filter(
      (a) => a.forEventId[0] === eventId && a.game === game
    );

    const master = parseJsonVal(betBody);

    let winBets: IBetResponse[] = [];

    relevantBets.forEach((r) => {
      if (compareHashTables(master, r.betBody)) {
        winBets.push(r);
      }
    });

    const winners = winBets?.map((w) => w.authorId);
    let result;

    const evRecord = await findEntity<IEventsResponse>(
      eventId,
      "Events",
      eventResKeysCheck
    );

    const { masterBetbody, winners: tableWinners } = evRecord;

    if (!isEmpty(winners)) {
      const users = await getTableAsArray<IUserResp[]>("Users");

      const winnerNames = users
        .filter((u) => winners.indexOf(u.innerId) !== -1)
        .map((usr) => usr.userName);

      await dbClient("Events").update(eventId, {
        masterBetbody: JSON.stringify({ ...masterBetbody, [game]: master }),
        winners: JSON.stringify({
          ...tableWinners,
          [game]: winnerNames.join(", "),
        }),
      });

      result = `${game}__Победа для: ${winnerNames.join(", ")}`;
    } else {
      await dbClient("Events").update(eventId, {
        masterBetbody: JSON.stringify({ ...masterBetbody, [game]: master }),
        winners: JSON.stringify({
          ...tableWinners,
          [game]: "Нет угадавших",
        }),
      });

      result = `Нет угадавших ${game}`;
    }

    res.send(result);
  } catch (e) {
    res.status(e?.status || 500).json(e);
  }
};
