"use strict";
const Account = use("App/Models/Account");
const Hash = use("Hash");
const Database = use("Database");
const Mail = use("Mail");
const Env = use("Env");

class AuthController {
  async authenticate({ request, auth, response }) {
    try {
      const { email } = request.only(["email"]);

      const account = await Database.select("*")
        .from("accounts")
        .where("email", email)
        .first();

      console.log("------------------ Account ---------------------");
      console.log(account);

      if (account) {
        if (account.role == "USER") {
          const digits = "0123456789";
          var otp = "";
          for (let i = 0; i < 6; i++) {
            otp = otp + digits[Math.floor(Math.random() * 10)];
          }

          console.log("--------------- OTP --------------------");
          console.log(otp);

          const dataSendEmail = {
            account: account.hn_number,
            email: account.email,
            otp,
            url: Env.get("VUE_APP_FONTEND_URL"),
          };

          console.log("--------------- DATA SEND MAIL --------------------");
          console.log(dataSendEmail);

          const mail = await Mail.send("login", dataSendEmail, (message) => {
            message
              //.from("Health Care")
              .from("bbmproject.noreply@gmail.com")
              .to(account.email)
              .subject("Login to HCARE");
          });

          console.log("--------------- Mail --------------------");
          console.log(mail);

          await Account.query()
            .where("account_id", account.account_id)
            .update({
              password: await Hash.make(dataSendEmail.otp),
            });

          const accountLogin = await Database.select("*")
            .from("accounts")
            .where("email", email)
            .first();
          console.log("--------------- New Password ------------------");
          console.log(accountLogin);

          if (account.password != accountLogin.password) {
            return "send mail for login successful";
          } else {
            return "password don't have changed";
          }
        } else {
          return response
            .status(403)
            .send("You don't have permission to user login");
        }
      } else {
        return response.status(401).send();
      }
    } catch (error) {
      console.log(error);
      return response
        .status(401)
        .json({ message: "You are not registered!", error });
    }
  }

  async confirmauthenticate({ request, response, auth }) {
    const data = request.only(["email", "password"]);

    try {
      if (await auth.attempt(data.email, data.password)) {
        let account = await Account.findBy("email", data.email);
        let token = await auth.generate(account);

        let dataResp = {
          first_name: account.first_name,
          last_name: account.last_name,
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

  async myprofile({ request, response, auth }) {
    try {
      return response.json({ user: await auth.getUser() });
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = AuthController;
