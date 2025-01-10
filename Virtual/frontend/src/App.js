import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './component/Login';
import PlaidIntegration2 from './component/PlaidIntegration2';
import Navbar from './component/Navbar';
import { Flip, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
    const [userId, setUserId] = useState(localStorage.getItem('userId') || '');

    return (
        <Router>
           <Navbar/>
            <Routes>
                <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUserId={setUserId} />} />
                <Route path="/plaid" element={<PlaidIntegration2 isLoggedIn={isLoggedIn} userId={userId} />} />
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
            <ToastContainer autoClose={2000} theme="colored" transition={Flip} position="top-center"/>
        </Router>
    );
};

export default App;
