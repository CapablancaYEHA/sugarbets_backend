// airtable часть пересекается с front репо
export interface IUserLoginRequest {
  pass: string;
  mail: string;
}
export interface IUserRegisterRequest extends IUserLoginRequest {
  name: string;
}

export interface IWebhookReq {
  notification_type: "p2p-incoming" | "card-incoming";
  amount: number; // с плавающей точкой
  withdraw_amount?: number | null;
  currency: 643; // всегда рубль
  datetime: string; // 2023-12-26T08:29:02Z
  sender: string; // может быть пустой строкой
  codepro: false;
  label?: string | null; // transfered id, не должна быть пустая строка
  sha1_hash: string;
  test_notification: boolean;
  unaccepted?: boolean;
  bill_id?: string | null;
  operation_label?: string | null;
  operation_id: string;
}
