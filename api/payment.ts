import axios from "axios";
import { Request } from "express";
import { IWebhookReq } from "./interface";
import { updateUserTickets } from "./airtable";

export const makePay = async (req, res) => {
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
};

export const hookHandler = async (req: Request<{}, {}, IWebhookReq>, res) => {
  const proxyHost = req.headers["x-forwarded-host"];
  const host = proxyHost ? proxyHost : req.headers.host || req.hostname;
  console.log("final host", host);
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
      // if (res === "success") {
      //   io.emit("ticketsUpdateSucc");
      // }
    } catch (e) {
      console.log(e);
    }
  }
};
