import cors from "cors";
import express from "express";
import * as httpInst from "http";
import { Server } from "socket.io";
import passport from "passport";

import "dotenv/config.js";

import { pass_middleware } from "./pass_middleware";
import { getEvents, getSingleEvent } from "./api/events";
import { doLogin, register } from "./api/auth";
import { hookHandler, makePay } from "./api/payment";
import { getBets, getPlayers, getTickets, postBet } from "./api/sutuational";
import { corsObj, isDevMode, originIp } from "./const";

const app = express();
const PORT = 4000;

// @ts-ignore
const http = httpInst.Server(app);
app.use(cors(isDevMode() ? {} : corsObj));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(passport.initialize());
pass_middleware(passport);

export const io = new Server(http, {
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
  });

  //   socket.on("betLeave", (data) => {
  //     console.log("🔥: user left room", `bet-${data.betId}`);
  //   });

  //   socket.on("disconnect", () => {
  //     console.log("☠️: A user disconnected");
  //   });
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

app.post("/api/bets", postBet);

app.get("/api/bets", passport.authenticate("jwt", { session: false }), getBets);

app.get(
  "/api/tickets",
  passport.authenticate("jwt", { session: false }),
  getTickets
);

app.get("/api/players", getPlayers);

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
