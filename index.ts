import cors from "cors";
import express from "express";
import * as httpInst from "http";
import { Server } from "socket.io";
import { config } from "dotenv";

import { findBet, getBetsList, sendBetAmount } from "./db";

config();

const isDevMode = () => process.env.NODE_ENV === "development";

const app = express();
const PORT = 4000;

// @ts-ignore
const http = httpInst.Server(app);
// FIXME подготовить для прода
app.use(cors());

// FIXME подготовить для прода
const io = new Server(http, {
  cors: {
    origin: "http://localhost:5173",
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
