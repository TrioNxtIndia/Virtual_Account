const connection = require('./db.Config');
const { v4: uuidv4 } = require('uuid');

const db = {
  addUser(username) {
    return new Promise((resolve, reject) => {
      const userId = uuidv4();
      const query = 'INSERT INTO users (user_id, username) VALUES (?, ?)';
      connection.query(query, [userId, username], (err, results) => {
        if (err) {
          return reject(err);
        }
        console.log('User created with ID:', userId);
        resolve({ userId });
      });
    });
  },
  saveAccessToken(userId, itemId, accessToken) {
     connection.query(
      `INSERT INTO access_tokens (item_id, user_id, access_token) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id),
         access_token = VALUES(access_token)`,
      [itemId, userId, accessToken]
    );
  },
  
  getAccessTokens(userId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT access_token FROM access_tokens WHERE user_id = ?';
      connection.query(query, [userId], (err, results) => {
        if (err) {
          return reject(err);
        }
        const accessTokens = results.map(row => row.access_token);
        resolve(accessTokens);
      });
    });
  },
  
  saveAccounts(userId, accounts) {
    for (const account of accounts) {
      connection.query(
        `INSERT INTO accounts (account_id, user_id, item_id, name, type, subtype, mask, balances_available, iso_currency_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           type = VALUES(type),
           subtype = VALUES(subtype),
           mask = VALUES(mask),
           balances_available = VALUES(balances_available),
           iso_currency_code = VALUES(iso_currency_code),
           item_id = VALUES(item_id)`,
        [
          account.account_id,
          userId,
          account.item_id,
          account.name,
          account.type,
          account.subtype,
          account.mask,
          account.balances.available,
          account.balances.iso_currency_code
        ]
      );
    }
  },
  
  
  getAccounts(userId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM accounts WHERE user_id = ?';
      connection.query(query, [userId], (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    });

  
  },

  getUser(userId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE user_id = ?';
      connection.query(query, [userId], (err, results) => {
        if (err) {
          return reject(err);
        }
        if (results.length === 0) {
          resolve(null);
        } else {
          resolve(results[0]);
        }
      });
    });
  },

  getAccessTokenForAccount(userId, accountId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT at.access_token
        FROM access_tokens at
        INNER JOIN accounts acc ON at.item_id = acc.item_id
        WHERE acc.account_id = ? AND at.user_id = ?
      `;
      connection.query(query, [accountId, userId], (err, results) => {
        if (err) {
          return reject(err);
        }
        if (results && results.length > 0 && results[0].access_token) {
          resolve(results[0].access_token);
        } else {
          resolve(null); 
        }
      });
    });
  },

  getNonNullAccessTokens(userId) {
    const query = 'SELECT access_token FROM access_tokens WHERE user_id = ? AND access_token IS NOT NULL AND access_token != ""';
    return new Promise((resolve, reject) => {
      connection.query(query, [userId], (err, results) => {
        if (err) {
          return reject(err);
        }
        const accessTokens = results.map(row => row.access_token);
        resolve(accessTokens);
      });
    });
  },

  getItemIdsForUser(userId) {
    const query = 'SELECT item_id FROM access_tokens WHERE user_id = ?';
    return new Promise((resolve, reject) => {
      
      connection.query(query, [userId], (err, results) => {
        if (err) {
          return reject(err);
        }
        const itemIds = results.map(row => row.item_id);
        resolve(itemIds);
      });
    });
  },
  
  updateBalance(userId, accountId, amount, type) {
    const query = `
      UPDATE accounts
      SET balances_available = balances_available + ?
      WHERE user_id = ? AND account_id = ?
    `;

    let amountToUpdate;

    if (type === 'credit') {
      amountToUpdate = amount; // For credit, add the amount
    } else if (type === 'debit') {
      amountToUpdate = -amount; // For debit, subtract the amount
    } else {
      throw new Error('Invalid transaction type'); // Handle invalid type
    }

    return new Promise((resolve, reject) => {
      connection.query(query, [amountToUpdate, userId, accountId], (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results);
        console.log(results);
      });
    });
  },

  saveTransferDetails(transferData) {
    return new Promise((resolve, reject) => {
      const transferId = uuidv4(); 
      const query = `INSERT INTO transfers (transfer_id, user_id, account_id, amount, status, plaid_transfer_id, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const { userId, accountId, amount, status, plaid_transfer_id, created_at } = transferData;
      connection.query(query, [transferId, userId, accountId, amount, status, plaid_transfer_id, created_at], (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    });
  },

   getTransfersByUserId (userId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM transfers WHERE user_id = ?';
      connection.query(query, [userId], (err, results) => {
        if (err) {
          console.log(err)
          return reject(err);
        }
        resolve(results);
      });
    });
  },

  updateTransferStatus(transfer_id, status) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE transfers
        SET status = ?
        WHERE plaid_transfer_id = ?
      `;
      connection.query(query, [status, transfer_id], (err, results) => {
        if (err) {
          return reject(err);
        }
        if (results.affectedRows === 0) {
          return reject(new Error('No transfer record found with the provided ID.'));
        }
        console.log(`Transfer status updated to ${status} for transfer ID ${transfer_id}`);
        resolve(results);
      });
    });
  },

  saveTransferEvent(eventData) {
    return new Promise((resolve, reject) => {
      const eventId = uuidv4();
      const query = `
        INSERT INTO transfer_events (event_id, transfer_id, event_type, event_time, event_details)
        VALUES (?, ?, ?, ?, ?)
      `;
      const { transfer_id, event_type, event_time, event_details } = eventData;
      connection.query(query, [eventId, transfer_id, event_type, event_time, event_details], (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    });
  }
};


module.exports = db;
