import cors from "cors";
import express from "express";
import * as httpInst from "http";
import { Server } from "socket.io";
import { config } from "dotenv";

import { findBet, getBetsList, sendBetAmount } from "./db";

config();

const isDevMode = () => process.env.NODE_ENV === "development";

const app = express();
// const PORT = isDevMode() ? 4000 : 80;
const PORT = 4000;

// @ts-ignore
const http = httpInst.Server(app);
// FIXME подготовить для прода
app.use(
  cors({
    allowedHeaders: [
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Credentials",
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Origin",
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "X-HTTP-Method-Override",
      "Request",
    ],
    exposedHeaders: ["*"],
    origin: "http://45.89.66.41",
    preflightContinue: false,
    methods: "GET", // "GET, POST, PUT, PATCH, POST, DELETE"
    optionsSuccessStatus: 200,
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With,Content-Type,Accept"
  );
  next();
});

// FIXME подготовить для прода
const io = new Server(http, {
  cors: {
    allowedHeaders: [
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Credentials",
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Origin",
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "X-HTTP-Method-Override",
      "Request",
    ],
    exposedHeaders: ["*"],
    origin: "http://45.89.66.41",
    preflightContinue: false,
    methods: "GET", // "GET, POST, PUT, PATCH, POST, DELETE"
    optionsSuccessStatus: 200,
  },
});

io.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);

  socket.on("betRoomJoin", (data) => {
    console.log("used joined room", `bet-${data.betId}`);
    socket.join(`bet-${data.betId}`);
  });

  socket.on("betSubmit", async (data) => {
    try {
      const newBetAmount = await sendBetAmount(data.betAmount, data.betId);
      io.in(`bet-${data.betId}`).emit("betUpdateResponse", {
        updatedValue: newBetAmount,
      });
    } catch (err) {
      console.log("err", err);
    }
  });

  socket.on("betLeave", (data) => {
    console.log("🔥: user left room", `bet-${data.betId}`);
  });

  socket.on("disconnect", () => {
    console.log("☠️: A user disconnected");
  });
});

app.get("/api/bets", async (req, res) => {
  try {
    let result = await getBetsList();
    res.send(result);
  } catch (err) {
    console.log("err", err);
  }
});

app.get("/api/bets/:id", async (req, res) => {
  try {
    let result = await findBet(req.params.id);
    res.send(result);
  } catch (err) {
    console.log("err", err);
  }
});

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

// FIXME
// чем emit отличается от broadcast
