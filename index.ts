import cors from "cors";
import express, { Request } from "express";
import * as httpInst from "http";
import { Server } from "socket.io";
import passport from "passport";

import "dotenv/config.js";

import {
  createUser,
  findBet,
  getBetsList,
  getUserTickets,
  login,
  sendBetAmount,
  updateUserTickets,
} from "./airtable/api";
import { corsObj, isDevMode, originIp } from "./const";
import { pass_middleware } from "./pass_middleware";
import { IWebhookReq } from "airtable/interface";

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
      let result = await getBetsList();
      res.send(result);
    } catch (err) {
      res.json(err);
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

app.get("/api/bets/:id", async (req, res) => {
  try {
    let result = await findBet(req.params.id);
    res.send(result);
  } catch (err) {
    console.log("err", err);
  }
});

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

app.post("/api/webhook", async (req: Request<{}, {}, IWebhookReq>, res) => {
  const proxyHost = req.headers["x-forwarded-host"];
  const host = proxyHost ? proxyHost : req.headers.host || req.hostname;
  if (host) {
    res.status(200).send();
  }
  let { label, withdraw_amount } = req.body;
  // FIXME С другой суммой в итоге надо сравнивать
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
