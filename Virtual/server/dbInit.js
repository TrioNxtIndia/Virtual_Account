// dbInit.js
const connection = require('./db.Config');

const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(255) NOT NULL
);
`;

const createAccessTokensTable = `
CREATE TABLE IF NOT EXISTS access_tokens (
  user_id VARCHAR(36),
  access_token VARCHAR(255),
  item_id VARCHAR(255) PRIMARY KEY,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
`;

const createAccountTable = `
CREATE TABLE accounts (
  account_id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  name VARCHAR(255),
  type VARCHAR(50),
  subtype VARCHAR(50),
  mask VARCHAR(10),
  balances_available DECIMAL(10, 2),
  iso_currency_code VARCHAR(10),
  item_id VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (item_id) REFERENCES access_tokens(item_id)
);`

const createTransfersTable = `
CREATE TABLE IF NOT EXISTS transfers (
  transfer_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  plaid_transfer_id VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);
`;


connection.query(createUsersTable, (err, results) => {
  if (err) {
    console.error('Error creating users table:', err);
    return;
  }
  console.log('Users table created');
});

connection.query(createAccessTokensTable, (err, results) => {
  if (err) {
    console.error('Error creating access tokens table:', err);
    return;
  }
  console.log('Access tokens table created');
});

connection.query(createAccountTable, (err, results) => {
  if (err) {
    console.error('Error creating accounts table:', err);
    return;
  }
  console.log('accounts table created');
});

connection.query(createTransfersTable, (err, results) => {
  if (err) {
    console.error('Error creating transfers table:', err);
    return;
  }
  console.log('Transfers table created');
});

connection.end();
