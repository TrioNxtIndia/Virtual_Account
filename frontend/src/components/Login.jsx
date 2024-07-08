import '../assets/Login.css'
import { useState } from "react";
import { IoIosMail } from "react-icons/io";
import { RiLockPasswordFill } from "react-icons/ri";
import API from '../Hook/Api';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [data, setData] = useState({ email: "", password: "" });

  const loginUser = async (e) => {
    e.preventDefault();
    const { email, password } = data;
    try {
      const res = await API.post('/login', { email, password });
      toast.success("Login Success...");
      localStorage.setItem('token', res.token);
      localStorage.setItem('userRole', res.role);
      navigate('/home')
    } catch (error) {
      toast.error(error.msg);
    }
  }

  const handleRegisterClick = () => {
    navigate('/register');
  }

  return (
    <div className="container">
      <div className="login d-flex justify-content-center align-items-center">
        <div className="card p-4">
          <form onSubmit={loginUser}>
            <div className="row">
              <h1 className="text-center">LOGIN</h1>
              <div className="col-12 mt-3">
                <div className="input-group">
                  <span className="input-group-text text-primary fs-4">
                    <IoIosMail />
                  </span>
                  <input
                    type="text"
                    value={data.email}
                    onChange={(e) =>
                      setData({ ...data, email: e.target.value })
                    }
                    className="form-control"
                    placeholder="Email"
                    required
                  />
                </div>
              </div>
              <div className="col-12 mt-3">
                <div className="input-group">
                  <span className="input-group-text text-primary fs-4">
                    <RiLockPasswordFill />
                  </span>
                  <input
                    type="password"
                    value={data.password}
                    onChange={(e) =>
                      setData({ ...data, password: e.target.value })
                    }
                    className="form-control"
                    placeholder="Password"
                    required
                  />
                </div>
              </div>
              <div className="d-grid gap-2 mt-3">
                <button className="btn btn-primary fw-bold" type="submit">
                  Login
                </button>
              </div>
              <div className="text-center mt-3">
                New Here, Click Here To <span className="move" onClick={handleRegisterClick}>Register</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
