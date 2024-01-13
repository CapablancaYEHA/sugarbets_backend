import { Request, Response } from "express";

import { IUserLoginRequest, IUserRegisterRequest } from "./interface";
import { createUser, login, getUserProfile } from "./airtable";

export const doLogin = async (req: Request<{}, {}, IUserLoginRequest>, res) => {
  const { mail, pass } = req.body;
  try {
    let result = await login({ mail, pass });
    res.send(result);
  } catch (err) {
    res.status(403).json(err);
  }
};

export const register = async (
  req: Request<{}, {}, IUserRegisterRequest>,
  res: Response
) => {
  const { name, mail, pass } = req.body;

  try {
    let result = await createUser({ name, mail, pass });
    res.status(201).send(result);
  } catch (err) {
    res.status(err?.status ?? 418).json(err);
  }
};

export const getProfile = async (req, res) => {
  let { user } = req.query;
  try {
    let result = await getUserProfile(user as string);
    res.json(result);
  } catch (err) {
    res.status(err?.status || 500).json(err);
  }
};
