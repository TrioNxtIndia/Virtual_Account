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
      res.json(createTokenResponse.data);
    } catch (error) {
      return res
        .status(statusCode.BAD_GATEWAY)
        .json({ message: error.message });
    }
  }

  async exchangePublicToken(req, res, next) {
    const { public_token, bankName } = req.body;
    try {
      const response = await plaidClient.itemPublicTokenExchange({
        public_token: public_token,
      });
      const accessToken = response.data.access_token;
      const details = new Account({
        accessToken: accessToken,
        bankName: bankName,
        userId: req.user.id,
      });
      await details.save();
      res.json({ accessToken });
    } catch (error) {
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
      const accounts = await Account.findAll({ where: { userId } });
      if (!accounts || accounts.length === 0) {
        return res
          .status(statusCode.NOT_FOUND)
          .json({ message: "User Not Found or No Accounts Found!" });
      }
      const accountsData = [];
      for (let i = 0; i < accounts.length; i++) {
        const { accessToken, bankName } = accounts[i]; 
        const plaidRequest = {
          access_token: accessToken,
        };
        const response = await plaidClient.authGet(plaidRequest);
        const accountDetails = response.data;
        accountDetails.bankName = bankName; 
        accountsData.push(accountDetails);
      }
      return res.status(statusCode.OK).json(accountsData);
    } catch (error) {
      return res.status(statusCode.BAD_GATEWAY).json({ msg: error.message });
    }
  }
}

export default new AccountController();
