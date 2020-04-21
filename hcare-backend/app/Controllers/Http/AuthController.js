"use strict";
const Account = use("App/Models/Account");
const Hash = use("Hash");
const Database = use("Database");
const Mail = use("Mail");
const Env = use("Env");

class AuthController {
  async authenticate({ request, auth, response }) {
    const { email } = request.only(["email"]);

    console.log(email);

    try {
      const account = await Database.select("*")
        .from("accounts")
        .where("email", email)
        .first();

      console.log(account);

      if (account) {
        const otp = `${Date.now()}${account.hn_number}`;
        console.log(otp);

        const dataSendEmail = {
          account: account.hn_number,
          email: account.email,
          otp,
          url: Env.get("VUE_APP_FONTEND_URL"),
        };
        console.log(dataSendEmail);

        const mail = await Mail.send("login", dataSendEmail, (message) => {
          message
            .to(account.email)
            .from("Health Care")
            .subject("Login to HCARE");
        });

        console.log(mail);

        await Account.query()
          .where("account_id", account.account_id)
          .update({
            password: await Hash.make(dataSendEmail.otp),
          });

        const accountLogin = Database.select("*")
          .from("accounts")
          .where("email", email);

        if (account.password != accountLogin.password) {
          return "send mail for login successful";
        } else {
          return "password don't have changed";
        }
      }
    } catch (error) {
      console.log(error);
      return response
        .status(401)
        .json({ message: "You are not registered!", error });
    }
  }

  async confirmauthenticate({ request, response, auth }) {
    const data = request.only(["email", "otp"]);
    const password = data.otp;
    console.log(data.email);
    console.log(password);

    try {
      if (await auth.attempt(data.email, password)) {
        let account = await Account.findBy("email", data.email);
        let token = await auth.generate(account);

        let dataResp = {
          account_id: account.account_id,
          hn_number: account.hn_number,
          first_name: account.first_name,
          last_name: account.last_name,
          verify: account.verify,
          gender: account.gender,
          date_of_birth: account.date_of_birth,
          email: account.email,
          telephone: account.telephone,
          role: account.role,

          type: token.type,
          token: token.token,
          refreshToken: token.refreshToken,
        };

        return response.json(dataResp);
      }
    } catch (error) {
      console.log(error);
      return response
        .status(401)
        .json({ message: "You are not registered!", error });
    }
  }
}

module.exports = AuthController;
