  const express = require("express");
  const cors = require("cors");
  const bodyParser = require("body-parser");
  const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
  const db = require('./tempDb'); 
  const http = require("http");
  

  const PLAID_WEBHOOK_SECRET = "https://42a9-2405-201-1015-a80d-7dd2-26a-f839-5030.ngrok-free.app/server/receive_webhook";

  const configuration = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": "656b485c4e877a001caf091a",
        "PLAID-SECRET": "118e8ef8cf343fd429f5fd72f7d646",
      },
    },
  });

  const plaidClient = new PlaidApi(configuration);

  const app = express();
 
  app.use(bodyParser.json());
  app.use(express.urlencoded({ extended: false }));
   
  app.use(cors());
  app.use(express.json());

  app.get("/",(req,res)=>{
    console.log("server is Running");
  })

  app.post('/login', async (req, res) => {
    const { userId } = req.body;
    try {
      const user = await db.getUser(userId);
      if (user) {
        res.json({ userId, username: user.username });
      } else {
        res.status(401).json({ error: 'Invalid User ID' });
      }
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  });

  app.post('/create', async (req, res) => {
    const { username } = req.body;
    try {
      const result = await db.addUser(username);
      res.json({ userId: result.userId });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.post("/create_link_token", async function (req, res) {
    const userId = req.body.userId; 
    console.log(userId);
  
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const plaidRequest = {
      user: {
        client_user_id: userId, 
      },
      client_name: "Plaid Test App",
      products: ["auth"],
      language: "en",
      redirect_uri: "http://localhost:8000",
      country_codes: ["US"],
      link_customization_name: "default",
      webhook: PLAID_WEBHOOK_SECRET,
    };

    try {
      const createTokenResponse = await plaidClient.linkTokenCreate(plaidRequest);
      res.json(createTokenResponse.data);
    } catch (error) {
      console.error('Error creating link token:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Failed to create link token' });
    }
  });


  app.post('/exchange_public_token', async (req, res) => {
    const { userId, publicToken } = req.body;
    try {
      const response = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });
      const accessToken = response.data.access_token;
      const itemId = response.data.item_id;
      const daata = response.data;
      console.log(daata)
      await db.saveAccessToken(userId, itemId, accessToken);
      res.json({ accessToken });
    } catch (error) {
      console.error('Error exchanging public token:', error);
      res.status(500).json({ error: 'Failed to exchange public token' });
    }
  });

  app.post("/get_account_details", async (req, res) => {
    const { userId } = req.body;

    try {
      const accessTokens = await db.getAccessTokens(userId);

      if (accessTokens.length === 0) {
        return res.status(400).json({ error: 'No access tokens found for user' });
      }

      const allAccounts = [];

      for (const token of accessTokens) {
        try {
      
          const itemResponse = await plaidClient.itemGet({ access_token: token });
          const itemId = itemResponse.data.item.item_id;

          
          await db.saveAccessToken(userId, itemId, token);

          const plaidResponse = await plaidClient.accountsGet({ access_token: token });
          const accounts = plaidResponse.data.accounts;

        
          const accountsWithItemId = accounts.map(account => ({
            ...account,
            item_id: itemId
          }));

          console.log(accountsWithItemId);

          
          await db.saveAccounts(userId, accountsWithItemId);

          allAccounts.push(...accountsWithItemId);
        } catch (error) {
          console.error('Error fetching accounts for token:', token, error.response ? error.response.data : error.message);
        
        }
      }

      res.json(allAccounts);
    } catch (error) {
      console.error('Error fetching access tokens:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Failed to get account details' });
    }
  });



  app.post('/create_authorization', async (req, res) => {
    const { userId, accountId, amount } = req.body;
    console.log("Authorization Input Details:", req.body);

    if (!userId || !accountId || !amount) {
      return res.status(400).json({ error: 'User ID, account ID, and amount are required' });
    }

    try {
      
      const accessToken = await db.getAccessTokenForAccount(userId,accountId);
      if (accessToken.length === 0) {
        return res.status(400).json({ error: 'No valid access token found for user' });
      }

      
      console.log("Access token:", accessToken);
      
    
      const accountResponse = await plaidClient.accountsGet({ access_token: accessToken });
      const validAccount = accountResponse.data.accounts.find(account => account.account_id === accountId);
      if (!validAccount) {
        return res.status(400).json({ error: 'Invalid account ID' });
      }

    
      const authorizationResponse = await plaidClient.transferAuthorizationCreate({
        access_token: accessToken,
        account_id: accountId,
        type: 'debit', // Or 'credit'
        network: 'same-day-ach',
        amount: amount.toString(),
        ach_class: 'ppd',
        user: {
          legal_name: 'John Doe',
          email_address: 'john.doe@example.com', 
              },
      });

      res.json({ authorization: authorizationResponse.data.authorization });
    } catch (error) {
      console.error('Error creating authorization:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Failed to create authorization' });
    }
  });

  app.post('/create_transfer', async (req, res) => {
    const { userId, accountId, amount, authorizationId } = req.body;
    console.log("Transfer Input Details:", req.body);

    if (!userId || !accountId || !amount || !authorizationId) {
      return res.status(400).json({ error: 'User ID, account ID, amount, and authorization ID are required' });
    }

    try {
      const accessToken = await db.getAccessTokenForAccount(userId, accountId);
      if (!accessToken) {
        return res.status(400).json({ error: 'No valid access token found for user' });
      }

      
      console.log("Access token for transfer:", accessToken);

      const transferResponse = await plaidClient.transferCreate({
        access_token: accessToken,
        account_id: accountId,
        authorization_id: authorizationId,
        amount: amount.toString(),
        description:'payment',
      });

    // db.updateBalance(userId, accountId, amount, 'debit');
      const transferData = {
        userId,
        accountId,
        amount,
        status: transferResponse.data.transfer.status,
        plaid_transfer_id: transferResponse.data.transfer.id,
        created_at: new Date(),
      };
      await db.saveTransferDetails(transferData);

      res.json({ transfer: transferResponse.data.transfer });
    } catch (error) {
      console.error('Error creating transfer:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: error.response ? error.response.data : 'Failed to create transfer' });
    }
  });

  app.post('/fetch_transactions', async (req, res) => {
    const { accessToken, startDate, endDate } = req.body;

    if (!accessToken || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const request = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
    };

    try {
        let transactions = [];
        let total_transactions = 0;
        
        do {
            const response = await plaidClient.transactionsGet(request);
            transactions = transactions.concat(response.data.transactions);
            total_transactions = response.data.total_transactions;
            request.options = {
                offset: transactions.length
            };
        } while (transactions.length < total_transactions);

        res.json({ transactions });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });


  app.post('/check_transfer_status', async (req, res) => {
    const { transferId } = req.body;
    console.log(req.body);


    const request = {
      transfer_id: transferId,
    };

    try {
      const response = await plaidClient.transferGet(request); // Use 'Transfer.get' method instead of 'transferGet'
      const transfer = response.data.transfer;
      res.json({ transfer });
    } catch (error) {
      console.error('Error checking transfer status:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Failed to check transfer status' });
    }
  });

  //payment api for UK and europe not for  US
  app.post('/create_payment', async (req, res) => {
    const { userId, accountId, recipientName, iban, amount, reference} = req.body;

    if (!userId || !accountId || !recipientName || !iban || !amount || !reference) {
        return res.status(400).json({ error: 'User ID, account ID, recipient name, IBAN, amount, reference, and receiver account number are required' });
    }

    try {
        const accessToken = await db.getAccessTokenForAccount(userId, accountId); // Fetch user's access token
        if (!accessToken) {
            return res.status(400).json({ error: 'No valid access token found for user' });
        }

        // Create Payment Initiation Recipient
        const recipientResponse = await plaidClient.paymentInitiationRecipientCreate({
            name: recipientName,
            iban: iban,
            address: {
                street: ['123 Main Street'],
                city: 'London',
                postal_code: 'SW1A 1AA',
                country: 'GB',
            },
        });
        const recipientId = recipientResponse.data.recipient_id;

        // Create Transfer Authorization
        const authorizationResponse = await plaidClient.transferAuthorizationCreate({
            access_token: accessToken,
            account_id: accountId,
            type: 'credit',
            network: 'ach',
            ach_class: 'ppd',
            amount: amount.toString(),
            user: {
              legal_name: 'John Doe',
              email_address: 'john.doe@example.com', 
                  },
        });
        const authorizationId = authorizationResponse.data.authorization.id;

        // Create Transfer
        const transferResponse = await plaidClient.transferCreate({
            access_token: accessToken,
            account_id: accountId,
            authorization_id: authorizationId,
            amount: amount,
            description: 'payment',
        });

        // Create Payment
        const paymentResponse = await plaidClient.paymentInitiationPaymentCreate({
            recipient_id: recipientId,
            reference: reference,
            amount: {
                currency: 'GBP',
                value: parseFloat(amount),
            },
        });

        res.json({ message: 'Payment created successfully', payment: paymentResponse.data });
    } catch (error) {
        console.error('Error in creating payment:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
  });

  app.post('/get_transfer_details', async (req, res) => {
    const { userId } = req.body;
  
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
  
    try {
      const transfers = await db.getTransfersByUserId(userId);
      if (transfers.length === 0) {
        return res.status(404).json({ error: 'No transfers found for user' });
      }
      res.json({ transfers });
    } catch (error) {
      console.error('Error fetching transfer details:', error);
      res.status(500).json({ error: 'Failed to fetch transfer details' });
    }
  });
  

  app.post('/server/receive_webhook', async (req, res) => {
    const { webhook_type, webhook_code } = req.body;
    console.log("Webhook received:", req.body);
    console.log("Webhook received in server side")
  
    if (webhook_type === 'TRANSFER' && webhook_code === 'TRANSFER_POSTED') {
      try {
        // Sync transfers
        const syncRequest = {
          after_id:225, 
          count:25, 
        };
        const syncResponse = await plaidClient.transferEventSync(syncRequest);
        const transferEvents = syncResponse.data.transfer_events;
       // console.log("transferEvents:",transferEvents);
  
        // Update each transfer status in the database
        for (const event of transferEvents) {
          const { transfer_id, event_type } = event;
          console.log(`Event type: ${event_type}, Transfer ID: ${transfer_id}`);
          if (event_type === 'posted') {
      
            const response = await plaidClient.transferGet({ transfer_id });
            const transfer = response.data.transfer;
        //    console.log("hello", transfer);
            const { status } = transfer;
  
            await db.updateTransferStatus(transfer_id, status);
            console.log(`Transfer status updated to ${status} in database for transfer_id ${transfer_id}`);
          
          }
        }
        res.status(200).send('Webhook received and transfers synced');
      } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Failed to process webhook');
      }
    } else {
      res.status(400).send('Invalid webhook type or code');
    }
  });

  
  
  app.listen(8000, () => {
    console.log("Server is running on port 8000");
  });
