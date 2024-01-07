// airtable часть пересекается с front репо
export interface IUserLoginRequest {
  pass: string;
  mail: string;
}
export interface IUserRegisterRequest extends IUserLoginRequest {
  name: string;
}

export interface IUserResp {
  userName: string;
  userMail: string;
  tickets: number;
  innerId: string;
  betsArray?: string[];
  paymentsArray?: string[];
  role: "user" | "admin";
}

export interface IWebhookReq {
  notification_type: "p2p-incoming" | "card-incoming";
  amount: number; // с плавающей точкой
  withdraw_amount?: number | null;
  currency: 643; // всегда рубль
  datetime: string; // 2023-12-26T08:29:02Z
  sender: string; // может быть пустой строкой
  codepro: false;
  label?: string | null; // кастомный лейбл, в моем случае юзер
  sha1_hash: string;
  test_notification: boolean;
  unaccepted?: boolean;
  bill_id?: string | null;
  operation_label?: string | null;
  operation_id: string;
}

export interface IEventsResRaw {
  betsArray?: string[]; // айдишники ставок
  eventTitle: string;
  games: string; // JSON
  prizePool: string; // JSON
  masterBetbody?: string | null; // JSON
  innerId: string;
  isActive: boolean;
  startDate: string; // "2023-12-27T13:00:00.000Z"
  org?: string;
  info?: string;
  locale: "RU" | "INT";
}

type IPrizePool = {
  [key: string]: number;
};
export type IBetBod = {
  [key: string]: string | string[];
};

export interface IEventsResponse
  extends Omit<IEventsResRaw, "games" | "prizePool" | "masterBetbody"> {
  games: string[];
  prizePool: IPrizePool;
  masterBetbody: IBetBod;
}

export interface ICreatePayReq {
  amount: number;
  withdraw_amount?: number | null;
  userId: string;
  comment?: string;
}

export interface ICreateBetReq {
  betBody: string; //json string всего объекта из формы
  game: string;
  userId: string;
  eventId: string;
}

export interface IBetResRaw {
  innerId: string;
  authorName: string[]; //один чел в массиве
  authorId: string;
  game: string;
  forEventName: [string]; // one elem
  forEventId: [string]; // one elem
  isActive: boolean[]; // one elem
  dateCreated: string; // "2023-12-27T13:00:00.000Z"
  betBody: string;
}

export interface IBetResponse extends Omit<IBetResRaw, "betBody"> {
  betBody: IBetBod;
}
