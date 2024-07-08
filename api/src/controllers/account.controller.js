import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import dotenv from "dotenv";
import statusCode from "../utils/statusCode.js";
import Account from "../models/Account.js";
dotenv.config();

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.CLIENT_ID,
      "PLAID-SECRET": process.env.SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

class AccountController {
  async createLinkToken(req, res) {
    // Get the client_user_id by searching for the current user
    const request = {
      user: {
        // This should correspond to a unique id for the current user.
        client_user_id: "user",
      },
      client_name: "Plaid Test App",
      products: ["auth"],
      language: "en",
      redirect_uri: "http://localhost:5173/",
      country_codes: ["US"],
    };
    try {
      const createTokenResponse = await plaidClient.linkTokenCreate(request);
      console.log("-------------", createTokenResponse);
      res.json(createTokenResponse.data);
    } catch (error) {
      return res
        .status(statusCode.BAD_GATEWAY)
        .json({ message: error.message });
    }
  }

  async exchangePublicToken(req, res, next) {
    const { public_token, bankName } = req.body;
    // const publicToken = req.body.public_token;
    try {
      const response = await plaidClient.itemPublicTokenExchange({
        public_token: public_token,
      });
      // These values should be saved to a persistent database and
      // associated with the currently signed-in user
      const accessToken = response.data.access_token;
      const details = new Account({
        accessToken: accessToken,
        bankName: bankName,
        userId: req.user.id,
      });
      await details.save();
      res.json({ accessToken });
    } catch (error) {
      console.log(error);
      return res
        .status(statusCode.BAD_GATEWAY)
        .json({ message: error.message });
    }
  }

  async auth(req, res) {
    try {
      const access_token = req.body.access_token;
      const plaidRequest = {
        access_token: access_token,
      };
      const response = await plaidClient.authGet(plaidRequest);
      return res.status(statusCode.OK).json(response.data);
    } catch (error) {
      return res
        .status(statusCode.BAD_GATEWAY)
        .json({ message: error.message });
    }
  }

    async getAccounts(req, res) {
      try {
          const userId = req.user.id;
          const accounts = await Account.findAll({ where: { userId }});
          if (!accounts || accounts.length === 0) {
              return res.status(statusCode.NOT_FOUND).json({ message: "User Not Found or No Accounts Found!" });
          }
          const accountsData = [];
          for (let i = 0; i < accounts.length; i++) {
              const access_token = accounts[i].accessToken;
              const plaidRequest = {
                  access_token: access_token
              };
              const response = await plaidClient.authGet(plaidRequest);
              accountsData.push(response.data);
          }
          return res.status(statusCode.OK).json(accountsData);
      } catch (error) {
          return res.status(statusCode.BAD_GATEWAY).json({ msg: error.message})
      }
    }

//   async getAccounts(req, res) {
//     try {
//       const userId = req.user.id;

//       // Fetch accounts with accessToken and bankName for the user
//       const accounts = await Account.findAll({
//         where: { userId },
//         attributes: ["accessToken", "bankName"], // Specify fields to retrieve
//       });

//       if (!accounts || accounts.length === 0) {
//         return res
//           .status(statusCode.NOT_FOUND)
//           .json({ message: "User Not Found or No Accounts Found!" });
//       }

//       const accountsData = accounts.map((account) => ({
//         bankName: account.bankName,
//         accessToken: account.accessToken,
//       }));
//       for (let i = 0; i < accounts.length; i++) {
//         const access_token = accounts[i].accessToken;
//         const plaidRequest = {
//           access_token: access_token,
//         };
//         const response = await plaidClient.authGet(plaidRequest);
//         accountsData.push({ ...response.data,  });
//       }

//       return res.status(statusCode.OK).json(accountsData);
//     } catch (error) {
//       return res.status(statusCode.BAD_GATEWAY).json({ msg: error.message });
//     }
//   }
}

export default new AccountController();
