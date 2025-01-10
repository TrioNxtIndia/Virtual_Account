import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.css';
import Card from 'react-bootstrap/Card';

const PlaidIntegration1 = () => {
    const [userId, setUserId] = useState('');
    const [linkToken, setLinkToken] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [transferResponse, setTransferResponse] = useState(null);

    // Function to create a new user
    const createUser = async () => {
        try {
            const response = await axios.post('http://localhost:8000/create', { username });
            setUserId(response.data.userId);
            console.log('User ID:', response.data.userId);
        } catch (error) {
            setError('Failed to create user');
            console.error('Error creating user:', error);
        }
    };

    // Function to create a Plaid link token
    const createLinkToken = async () => {
        try {
            const response = await axios.post('http://localhost:8000/create_link_token', { userId });
            setLinkToken(response.data.link_token);
            console.log('Link Token:', response.data.link_token);
        } catch (error) {
            setError('Failed to create link token');
            console.error('Error creating link token:', error);
        }
    };

    // Function to exchange public token for access token
    const exchangePublicToken = async (publicToken) => {
        try {
            const response = await axios.post('http://localhost:8000/exchange_public_token', { userId, publicToken });
            await fetchAccountDetails();
        } catch (error) {
            setError('Failed to exchange public token');
            console.error('Error exchanging public token:', error);
        }
    };

    // Function to fetch account details using Plaid API
    const fetchAccountDetails = async () => {
        try {
            const response = await axios.post('http://localhost:8000/get_account_details', { userId });
            setAccounts(response.data);
            console.log('Account Details:', response.data);
        } catch (error) {
            setError('Failed to fetch account details');
            console.error('Error fetching account details:', error);
        }
    };

    // Function to handle form submission and create user
    const handleSubmit = async (e) => {
        e.preventDefault();
        await createUser();
    };

    // Function to handle Plaid link success callback
    const handlePlaidLinkSuccess = async (publicToken, metadata) => {
        await exchangePublicToken(publicToken);
    };

    // Effect hook to fetch account details when userId changes
    useEffect(() => {
        if (userId) {
            fetchAccountDetails();
        }
    }, [userId]);

    // Function to initialize Plaid Link
    const initializePlaidLink = () => {
        if (linkToken) {
            window.Plaid.create({
                token: linkToken,
                onSuccess: handlePlaidLinkSuccess,
            }).open();
        }
    };

    // Function to handle click on link button
    const handleLinkButtonClick = () => {
        if (linkToken) {
            initializePlaidLink();
        } else {
            createLinkToken();
        }
    };

    // Function to create transfer intent
    const createTransferIntent = async () => {
        const accountId = accounts.length > 0 && accounts[0].length > 0 ? accounts[0][0].account_id : null;

        if (!accountId) {
            setError('No account available for transfer intent');
            return;
        }

        try {
            const response = await axios.post('http://localhost:8000/transfer-intent', { account_id: accountId });
            setTransferResponse(response.data);
            console.log('Transfer Intent Response:', response.data);
        } catch (error) {
            setError('Failed to create transfer intent');
            console.error('Error creating transfer intent:', error);
        }
    };

    // Function to create transfer link token
    const createTransferLinkToken = async () => {
        const intentId = transferResponse?.data.transfer_intent?.id;

        if (intentId) {
            try {
                const response = await axios.post('http://localhost:8000/transfer-link-token-initial', {
                    userId,
                    intent_id: intentId,
                    accessTokenData: linkToken,
                });
                setLinkToken(response.data.link_token);
                console.log('Transfer Link Token:', response.data);
            } catch (error) {
                setError('Failed to create transfer link token');
                console.error('Error creating transfer link token:', error);
            }
        } else {
            setError('Transfer response or intent ID is missing');
            console.error('Transfer response or intent ID is missing:', transferResponse);
        }
    };

    return (
        <div>
            {!userId ? (
                <form onSubmit={handleSubmit}>
                    <label>
                        Username:
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </label>
                    <button type="submit">Create User</button>
                    {error && <p>{error}</p>}
                </form>
            ) : (
                <div style={{ justifyContent: 'center', textAlign: 'center', margin: '50px' }}>
                    <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'white', padding: '5px' }}>
                        Login Name: <b style={{ color: 'red' }}>{username}</b>
                    </div>

                    <button onClick={handleLinkButtonClick} className='btn btn-success'>
                        Click to Link Bank
                    </button>

                    <h2>Account Details</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {accounts.length > 0 ? (
                            accounts.map((tokenAccounts, tokenIndex) => (
                                <Fragment key={tokenIndex}>
                                    {tokenAccounts.length > 0 ? (
                                        tokenAccounts.map((account) => (
                                            <Card key={account.account_id} style={{ margin: '10px', width: '250px', backgroundColor: 'silver', display: 'inline-block' }}>
                                                <Card.Body>
                                                    <Card.Title>Bank Details</Card.Title>
                                                    <Card.Text>
                                                        <p><b>Account Name:</b> {account.name}</p>
                                                        <p><b>Type:</b> {account.type}</p>
                                                        <p><b>Sub-Type:</b> {account.subtype}</p>
                                                        <p><b>Mask:</b> *** *** {account.mask}</p>
                                                        <p><b>Balance Available:</b> {account.balances.available} {account.balances.iso_currency_code}</p>
                                                    </Card.Text>
                                                </Card.Body>
                                            </Card>
                                        ))
                                    ) : (
                                        <p>No accounts linked for this token.</p>
                                    )}
                                </Fragment>
                            ))
                        ) : (
                            <p>No accounts linked.</p>
                        )}
                    </div>

                    <h2>Transfer Intent</h2>
                    <button onClick={createTransferIntent} className='btn btn-primary'>
                        Create Transfer Intent
                    </button>
                    {transferResponse && (
                        <div>
                            <h3>Transfer Intent Response:</h3>
                            <pre>{JSON.stringify(transferResponse, null, 2)}</pre>
                        </div>
                    )}

                    <button onClick={createTransferLinkToken} className='btn btn-warning'>
                        Create Transfer Link Token
                    </button>

                    {error && <p>{error}</p>}
                </div>
            )}
        </div>
    );
};

export default PlaidIntegration1;
