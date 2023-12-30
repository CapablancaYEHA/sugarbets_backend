import axios from "axios";
import cors from "cors";
import express, { Request } from "express";
import * as httpInst from "http";
import { Server } from "socket.io";
import passport from "passport";

import "dotenv/config.js";

import {
  createBet,
  createUser,
  findEntity,
  getTableAsArray,
  getUserTickets,
  login,
  updateUserTickets,
} from "./airtable/api";
import { corsObj, isDevMode, originIp } from "./const";
import { betsResponseKeysCheck } from "./airtable/utils";
import { pass_middleware } from "./pass_middleware";
import { IEventsResponse, IWebhookReq } from "./airtable/interface";

const app = express();
const PORT = 4000;

// @ts-ignore
const http = httpInst.Server(app);
app.use(cors(isDevMode() ? {} : corsObj));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(passport.initialize());
pass_middleware(passport);

const io = new Server(http, {
  cors: {
    origin: isDevMode() ? "*" : originIp,
  },
});

io.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);

  //   socket.on("betRoomJoin", (data) => {
  //     console.log("used joined room", `bet-${data.betId}`);
  //     socket.join(`bet-${data.betId}`);
  //   });

  //   socket.on("betSubmit", async (data) => {
  //     try {
  //       const newBetAmount = await sendBetAmount(data.betAmount, data.betId);
  //       io.in(`bet-${data.betId}`).emit("betUpdateResponse", {
  //         updatedValue: newBetAmount,
  //       });
  //     } catch (err) {
  //       console.log("err", err);
  //     }
  //   });

  //   socket.on("betLeave", (data) => {
  //     console.log("🔥: user left room", `bet-${data.betId}`);
  //   });

  socket.on("disconnect", () => {
    console.log("☠️: A user disconnected");
  });
});

app.get(
  "/api/bets",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      let result = await getTableAsArray("Bets");
      res.send(result);
    } catch (err) {
      res.json(err);
    }
  }
);

app.get(
  "/api/events",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      let result = await getTableAsArray<IEventsResponse[]>(
        "Events",
        betsResponseKeysCheck
      );
      res.send(result);
    } catch (err) {
      res.status(err?.status || 500).json(err);
    }
  }
);

// Если ответ предполагается не стринга\json, то его нельзя просто так отправить, нужно преобразовать в json
app.get(
  "/api/tickets",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let { user } = req.query;
    try {
      let result = await getUserTickets(user as string);
      res.json(result);
    } catch (err) {
      res.status(err?.status || 500).json(err);
    }
  }
);

app.get("/api/players", async (req, res) => {
  try {
    let result = await getTableAsArray("Players");
    res.send(result);
  } catch (err) {
    res.json(err);
  }
});

app.get(
  "/api/events/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
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
  }
);

app.post("/api/auth/register", async (req, res) => {
  const { name, mail, pass } = req.body;
  try {
    let result = await createUser({ name, mail, pass });
    res.status(201).send(result);
  } catch (err) {
    res.status(err?.status ?? 418).json(err);
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { mail, pass } = req.body;
  try {
    let result = await login({ mail, pass });
    res.send(result);
  } catch (err) {
    res.status(403).json(err);
  }
});

app.post("/api/bets", async (req, res) => {
  const { betBody, game, userId, eventId } = req.body;

  try {
    let result = await createBet({ betBody, game, userId, eventId });
    res.status(201).send(result);
  } catch (err) {
    res.status(err?.status ?? 418).json(err);
  }
});

app.post("/api/payment", async (req, res) => {
  const { id, returnUri } = req.body;
  axios
    .post(
      "https://yoomoney.ru/quickpay/confirm",
      {
        receiver: "4100118483492189",
        label: id,
        "quickpay-form": "button",
        sum: 2.0,
        paymentType: "AC",
        successURL: returnUri,
      },
      {
        timeout: 4000,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    )
    .then((response) => {
      const { path } = response.request;
      if (path.includes("error?reason")) {
        throw { message: "Ошибка инициализации платежа" };
      }

      res.send(`https://yoomoney.ru${path}`);
    })
    .catch((err) => res.status(err?.status ?? 418).json(err));
});

app.post("/api/webhook", async (req: Request<{}, {}, IWebhookReq>, res) => {
  const proxyHost = req.headers["x-forwarded-host"];
  const host = proxyHost ? proxyHost : req.headers.host || req.hostname;
  //   FIXME Никогда не посылать ответ?
  //   if (host) {
  //     res.status(200).send();
  //   }
  let { label, withdraw_amount } = req.body;
  // FIXME Нужно просто проверять хаш
  if (withdraw_amount != 2.0) {
    console.log("Подмена платежа?");
    res.end();
  } else {
    try {
      const res = await updateUserTickets(label!);
      if (res === "success") {
        io.emit("ticketsUpdateSucc");
      }
    } catch (e) {
      console.log(e);
    }
  }
});

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
