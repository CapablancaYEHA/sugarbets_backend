import axios from "axios";
import { Request } from "express";
import { IWebhookReq } from "./interface";
import { createPayment, updateUserAfterPayment } from "./airtable";
import { compareSha } from "./utils";

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
  let { label, sha1_hash, amount, withdraw_amount } = req.body;
  if (compareSha(req.body, label, sha1_hash)) {
    try {
      const payId = await createPayment({
        amount,
        withdraw_amount,
        userId: label!,
      });
      await updateUserAfterPayment({ userId: label!, payId });
      res.status(200).send();
    } catch (e) {
      console.log("Ошибка при обработке доната: ", e);
    }
  } else {
    console.log("Ошибка проверки sha");
    await createPayment({
      amount,
      withdraw_amount,
      userId: label!,
      comment: "Платеж, видимо прошел, но в ДБ занести не можем",
    });
    res.end();
  }
};
