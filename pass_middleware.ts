import { dbClient } from "./api/airtable";
import { isEmpty } from "lodash-es";
import { ExtractJwt, Strategy } from "passport-jwt";

var opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT!,
};

export const pass_middleware = (psp: any) => {
  psp.use(
    new Strategy(opts, async (payload, done) => {
      try {
        const byMail = await dbClient("Users")
          .select({ filterByFormula: `{userMail}="${payload.mail}"` })
          .all();

        if (!isEmpty(byMail[0]) && !isEmpty(byMail[0]?._rawJson?.fields)) {
          const { userName, userMail } = byMail[0]._rawJson.fields;
          done(null, { name: userName, mail: userMail });
        } else {
          done(null, false);
        }
      } catch (e) {
        console.log("Ошибка с passport-jwt");
        throw { message: e?.message };
      }
    })
  );
};
