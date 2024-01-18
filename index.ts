import cors from "cors";
import express from "express";
import * as httpInst from "http";
import { Server } from "socket.io";
import passport from "passport";
import * as httpsInst from "https";
import * as fs from "fs";

import "dotenv/config.js";
import { pass_middleware } from "./pass_middleware";
import { closeEvent, getEvents, getSingleEvent } from "./api/events";
import { doLogin, register, getProfile } from "./api/auth";
import { hookHandler, makePay } from "./api/payment";
import { getPlayers, postBet } from "./api/sutuational";
import { getBets, getSingleBet } from "./api/bets";
import { corsObj, isDevMode, originIp } from "./const";

const app = express();

// @ts-ignore
const http = httpInst.Server(app);
// @ts-ignore
const https = httpsInst.Server(
  {
    key: fs.readFileSync("../ssl-self/selfsigned.key", "utf8"),
    cert: fs.readFileSync("../ssl-self/selfsigned.crt", "utf8"),
  },
  app
);
app.use(cors(isDevMode() ? {} : corsObj));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(passport.initialize());
pass_middleware(passport);

export const io = new Server(isDevMode() ? http : https, {
  cors: {
    origin: isDevMode() ? "*" : originIp,
  },
});

io.on("connection", (socket) => {
  //   console.log(`⚡: ${socket.id} user just connected!`);
  socket.on("eventPageVisit", (data) => {
    socket.join(`event-${data.eventId}`);
  });

  socket.on("eventPageLeave", (data) => {
    socket.leave(`event-${data.eventId}`);
    // console.log("☠️: User left event room");
  });
});

app.post("/api/auth/register", register);
app.post("/api/auth/login", doLogin);
app.post("/api/payment", makePay);
app.post("/api/webhook", hookHandler);
app.get(
  "/api/events",
  passport.authenticate("jwt", { session: false }),
  getEvents
);
app.get(
  "/api/events/:id",
  passport.authenticate("jwt", { session: false }),
  getSingleEvent
);
app.post(
  "/api/events/close",
  passport.authenticate("jwt", { session: false }),
  closeEvent
);

app.post(
  "/api/bets",
  passport.authenticate("jwt", { session: false }),
  postBet
);
app.get(
  "/api/bets/:id",
  passport.authenticate("jwt", { session: false }),
  getSingleBet
);
// ставки пользователя
app.get("/api/bets", passport.authenticate("jwt", { session: false }), getBets);

app.get(
  "/api/profile",
  passport.authenticate("jwt", { session: false }),
  getProfile
);

app.get("/api/players", getPlayers);

// http.listen(80, () => {
//   console.log("Server listening on 80");
// });

https.listen(443, () => {
  console.log("SSL listening on 443");
});
