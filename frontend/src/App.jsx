import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import { Flip, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./components/Home";
import Protectroute from "./Protectroute";

function App() {
  const isLoggedIn = localStorage.getItem("token");

  return (
    <>
      <Routes>
        {/* Unauthorized Routes */}
        {!isLoggedIn && (
          <>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Signup />}></Route>
          </>
        )}

        {/* Protected Routes  */}
        <Route element={<Protectroute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<Navigate to='/home' />} />
        </Route>
        
      </Routes>
      <ToastContainer autoClose={2000} theme="colored" transition={Flip} />
    </>
  );
}

export default App;
