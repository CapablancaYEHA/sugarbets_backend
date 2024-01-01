import { findEntity, getTableAsArray } from "./airtable";
import { betsResponseKeysCheck } from "./utils";
import { IEventsResponse } from "./interface";
import axios from "axios";

export const getEvents = async (req, res) => {
  try {
    let result = await getTableAsArray<IEventsResponse[]>(
      "Events",
      betsResponseKeysCheck
    );
    res.send(result);
  } catch (err) {
    res.status(err?.status || 500).json(err);
  }
};

export const getSingleEvent = async (req, res) => {
  try {
    let result = await findEntity(
      req.params.id,
      "Events",
      betsResponseKeysCheck
    );
    res.send(result);
  } catch (err) {
    res.status(err?.status || 500).json(err);
  }
};
