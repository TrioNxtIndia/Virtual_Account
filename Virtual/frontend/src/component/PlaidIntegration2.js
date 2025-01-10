import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.css';
import Card from 'react-bootstrap/Card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const PlaidIntegration2 = ({ isLoggedIn, userId }) => {
    const [linkToken, setLinkToken] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [transfers, setTransfers] = useState([]);
    //const [error, setError] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [selectedAccountIds, setSelectedAccountIds] = useState([]);
    const [authorizationIds, setAuthorizationIds] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

  

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
        } else {
            fetchAccountDetails();
            
            
         const intervalId = setInterval(() => {
            setupSocket();
            fetchTransferDetails();
            console.log("hello");
        }, 10000);
        
        }
    }, [isLoggedIn, userId, navigate]);

   

    const setupSocket = async () => {
        try {
           
            const response = await axios.post('http://localhost:8000/server/receive_webhook', {
                webhook_type: "TRANSFER",
                webhook_code: "TRANSFER_POSTED"
            });
            console.log(response.data);
            
        } catch (error) {
            console.error('Error fetching transfers:', error);
        }
    };
    const createLinkToken = async () => {
        try {
            const response = await axios.post('http://localhost:8000/create_link_token', { userId });
            setLinkToken(response.data.link_token);
        } catch (error) {
            toast.error('Failed to create link token:', error);
        }
    };

    const exchangePublicToken = async (publicToken) => {
        try {
            await axios.post('http://localhost:8000/exchange_public_token', { userId, publicToken });
            await fetchAccountDetails();
        } catch (error) {
            toast.error('Failed to exchange public token');
        }
    };

    const fetchAccountDetails = async () => {
        try {
            setIsLoading(true);
            const response = await axios.post('http://localhost:8000/get_account_details', { userId });
            setAccounts(response.data);
            setIsLoading(false);
            console.log('Account Details:', response.data);
        } catch (error) {
            setIsLoading(false);
            toast.error('Failed to fetch account details...');
            console.log(error);
        }
    };

    const fetchTransferDetails = async () => {
        try {
            setIsLoading(true);
            const response = await axios.post('http://localhost:8000/get_transfer_details', { userId });
            setTransfers(response.data.transfers); 
            setIsLoading(false);
           // console.log('Transfer Table Deatails:', response.data);
        } catch (error) {
            setIsLoading(false);
            toast.error('Failed to fetch transfer details...');
            console.log(error);
        }
    };

    const handlePlaidLinkSuccess = async (publicToken, metadata) => {
        await exchangePublicToken(publicToken);
    };

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

    const handleAccountSelection = (accountId) => {
        const account = accounts.find(acc => acc.account_id === accountId);
        const amountPerAccount = (transferAmount / (selectedAccountIds.length + 1)).toFixed(2);
        if (account.balances.available < amountPerAccount) {
            toast.error('This account does not have sufficient balance.');
            return;
        }
        setSelectedAccountIds((prev) => {
            if (prev.includes(accountId)) {
                return prev.filter(id => id !== accountId);
            } else {
                return [...prev, accountId];
            }
        });
    };

    const createAuthorization = async (accountId, amount) => {
        try {
            const response = await axios.post('http://localhost:8000/create_authorization', { userId, accountId, amount });
            setAuthorizationIds((prev) => ({ ...prev, [accountId]: response.data.authorization.id }));
            console.log("Authorization created:", response.data);
            return response.data.authorization.id;
        } catch (error) {
            toast.error('Failed to create authorization');
            console.error('Error creating authorization:', error);
            throw error;
        }
    };

    const createTransfer = async (accountId, authorizationId, amount) => {
        try {
            const response = await axios.post('http://localhost:8000/create_transfer', { userId, accountId, amount, authorizationId });
            console.log('Transfer successful:', response.data);
            toast.success("Transfer Successful");
        } catch (error) {
            toast.error('Failed to create transfer');
            console.error('Error creating transfer:', error);
        }
    };

    const handleTransferSubmit = async (e) => {
        e.preventDefault();
        if (selectedAccountIds.length === 0) {
            toast.error('Please select at least one account for transfer.');
            return;
        }
        if (!transferAmount || isNaN(transferAmount) || transferAmount <= 0) {
            toast.error('Please enter a valid transfer amount.');
            return;
        }
        const amountPerAccount = (transferAmount / selectedAccountIds.length).toFixed(2);

        try {
            for (let accountId of selectedAccountIds) {
                const authId = await createAuthorization(accountId, amountPerAccount);
                await createTransfer(accountId, authId, amountPerAccount);
            }
            setSelectedAccountIds([]);
            setAuthorizationIds({});
            setTransferAmount('');

            const updatedAccounts = accounts.map(account => {
                if (selectedAccountIds.includes(account.account_id)) {
                    const newBalance = account.balances.available - amountPerAccount;
                    return { ...account, balances: { ...account.balances, available: newBalance } };
                }
                return account;
            });
            setAccounts(updatedAccounts);
            fetchTransferDetails();

        } catch (error) {
            console.error('Error in transfer process:', error);
        }
    };

    const handleLogOut = () => {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userId");
        navigate("/login");
    };

    return (
        <>
            <div className="container-fluid position-relative">
                <div className="position-absolute top-0 end-0 p-2">
                    Login Id: <b style={{ color: 'red' }}>{userId}</b><br />
                    <button onClick={handleLogOut} className='btn btn-danger ml-2' style={{ marginLeft: '280px' }}>LogOut</button>
                </div>
            </div>
            <div>
                <div style={{ justifyContent: 'center', textAlign: 'center', marginTop: '20px' }}>
                    <button onClick={handleLinkButtonClick} className='btn btn-success'>
                        Click to Link Bank
                    </button>

                    <h2>Account Details</h2>
                    {isLoading && <p>Loading...</p>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {accounts.length > 0 ? (
                            accounts.map((account) => (
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
                                        <button onClick={() => handleAccountSelection(account.account_id)} className='btn btn-primary'>
                                            {selectedAccountIds.includes(account.account_id) ? 'Deselect' : 'Select'}
                                        </button>
                                    </Card.Body>
                                </Card>
                            ))
                        ) : (
                            <p>No accounts linked.</p>
                        )}
                    </div>

                    {selectedAccountIds.length > 0 && (
                        <form onSubmit={handleTransferSubmit} style={{ marginTop: '20px' }}>
                            <input
                                type="number"
                                placeholder="Enter Total Transfer Amount"
                                value={transferAmount}
                                onChange={(e) => setTransferAmount(e.target.value)}
                                style={{ width: '200px', margin: '16px' }}
                            />
                            <button type="submit" className='btn btn-warning'>Transfer</button>
                        </form>
                    )}
                    <hr></hr>
                    <h2>Transfer Details</h2>
                    {isLoading && <p>Loading...</p>}
                    {transfers.length > 0 ? (
                        <table className="table table-striped table-bordered table-hover" style={{ marginTop: '20px' }}>
                            <thead>
                                <tr>
                                    <th>Transfer Id</th>
                                    <th>Account Id</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transfers.map((transfer) => (
                                    <tr key={transfer.transfer_id}>
                                        <td>{transfer.plaid_transfer_id}</td>
                                        <td>{transfer.account_id}</td>
                                        <td>{transfer.amount}</td>
                                        <td>{transfer.status}</td>
                                        <td>{transfer.created_at}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                    ) : (
                        <p>No transfers found.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default PlaidIntegration2;
