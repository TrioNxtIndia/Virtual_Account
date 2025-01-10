import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ({ setIsLoggedIn, setUserId }) => {
    const [username, setUsername] = useState('');
    const [userIdInput, setUserIdInput] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const createUser = async () => {
        try {
            const response = await axios.post('http://localhost:8000/create', { username });
            const { userId } = response.data;
            setUserId(userId);
            setIsLoggedIn(true);
            localStorage.setItem('isLoggedIn', true);
            localStorage.setItem('userId', userId);
            navigate('/plaid');
        } catch (error) {
            setError('Failed to create user');
        }
    };

    const loginUser = async () => {
        try {
            const response = await axios.post('http://localhost:8000/login', { userId: userIdInput });
            const { userId } = response.data;
            setUserId(userId);
            setIsLoggedIn(true);
            localStorage.setItem('isLoggedIn', true);
            localStorage.setItem('userId', userId);
            navigate('/plaid');
        } catch (error) {
            setError('Failed to login');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await createUser();
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        await loginUser();
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <label>
                    Username:
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                </label>
                <button type="submit">Create User</button>
            </form>
            <form onSubmit={handleLogin}>
                <label>
                    User ID:
                    <input type="text" value={userIdInput} onChange={(e) => setUserIdInput(e.target.value)} />
                </label>
                <button type="submit">Login</button>
                {error && <p>{error}</p>}
            </form>
        </div>
    );
};

export default Login;
