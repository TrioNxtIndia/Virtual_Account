import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.css';
import Card from 'react-bootstrap/Card';
import { Fragment } from 'react';

const PlaidIntegration = () => {
    const [userId, setUserId] = useState('');
    const [linkToken, setLinkToken] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    
    const createUser = async () => {
        try {
            const response = await axios.post('http://localhost:8000/create', { username });
            setUserId(response.data.userId);
            console.log(response.data.userId);
        } catch (error) {
            setError('Failed to create user');
        }
    };

    const createLinkToken = async () => {
        try {
            const response = await axios.post('http://localhost:8000/create_link_token', { userId });
            setLinkToken(response.data.link_token);
        } catch (error) {
            setError('Failed to create link token');
        }
    };

    const exchangePublicToken = async (publicToken) => {
        try {
            const response = await axios.post('http://localhost:8000/exchange_public_token', { userId, publicToken });
            await fetchAccountDetails(); 
        } catch (error) {
            setError('Failed to exchange public token');
        }
    };

    const fetchAccountDetails = async () => {
        try {
            const response = await axios.post('http://localhost:8000/get_account_details', { userId });
            setAccounts(response.data);
            console.log(response.data);
        } catch (error) {
            setError('Failed to fetch account details');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await createUser();
    };

    const handlePlaidLinkSuccess = async (publicToken, metadata) => {
        await exchangePublicToken(publicToken);
    };


    useEffect(() => {
        if (userId) {
            fetchAccountDetails();
        }
    }, [userId]);


    const initializePlaidLink = () => {
        if (linkToken) {
            window.Plaid.create({
                token: linkToken,
                onSuccess: handlePlaidLinkSuccess,
            }).open();
        }
    };

    const handleLinkButtonClick = () => {
        if (linkToken) {
            initializePlaidLink();
        } else {
            createLinkToken();
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
                        Login Name: <b style={{color:'red'}}>{username}</b>
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
                                                        <p><b>Account Name :</b> {account.name}</p>
                                                        <p><b>Type :</b> {account.type}</p>
                                                        <p><b>Sub-Type :</b> {account.subtype}</p>
                                                        <p><b>Mask :</b> *** *** {account.mask}</p>
                                                        <p><b>Balance Available :</b> {account.balances.available} {account.balances.iso_currency_code}</p>
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

                    {error && <p>{error}</p>}
                </div>
            )}
        </div>
    );
};

export default PlaidIntegration;
