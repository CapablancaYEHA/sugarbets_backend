import Airtable, { FieldSet } from "airtable";

const base_id = "appzEYCiuOo01xWiC";
const personal_token =
  "patRfpIBsa2er3nNH.e89d9e149ba365a3342960686f85a23d777036ea5d65cdf53b2d52a90e37e9b7";

const dbClient = new Airtable({ apiKey: personal_token }).base(base_id);

export const getBetsList = () => {
  const final: any[] = [];

  return new Promise((res, rej) => {
    dbClient("Bet")
      .select()
      .eachPage(
        (records, fetchNextPage) => {
          records.forEach((record) => {
            const o = {
              id: record._rawJson.id,
              ...record._rawJson.fields,
            };
            final.push(o);
          });
          fetchNextPage();
          res(final);
        },
        (err) => {
          if (err) {
            rej(err);
          }
        }
      );
  });
};

export const findBet = async (id: string) => {
  try {
    const record = await dbClient("Bet").find(id);
    return record._rawJson.fields;
  } catch (e) {
    console.log("bet search err", e);
  }
};

export const sendBetAmount = async (amount: number, id: string) => {
  try {
    let newValue: number;
    const record = await dbClient("Bet").find(id);
    newValue = record._rawJson.fields.betTotal + amount;
    await dbClient("Bet").update(id, {
      betTotal: newValue,
    });
    console.log("Succ update!");
    return newValue;
  } catch (e) {
    console.log("bet update err", e);
  }
};
