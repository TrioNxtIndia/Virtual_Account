import { Navigate, Outlet } from "react-router-dom";
import Navbar from "./includes/Navbar";

function Protectroute() {
  const isLoggedIn = !!localStorage.getItem("token");

  return isLoggedIn ? (
    <>
      <Navbar />
      <Outlet />
    </>
  ) : (
    <Navigate to={"login"} />
  );
}

export default Protectroute;
