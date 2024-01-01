import { createUser, login } from "./airtable";

export const doLogin = async (req, res) => {
  const { mail, pass } = req.body;
  try {
    let result = await login({ mail, pass });
    res.send(result);
  } catch (err) {
    res.status(403).json(err);
  }
};

export const register = async (req, res) => {
  const { name, mail, pass } = req.body;
  try {
    let result = await createUser({ name, mail, pass });
    res.status(201).send(result);
  } catch (err) {
    res.status(err?.status ?? 418).json(err);
  }
};
