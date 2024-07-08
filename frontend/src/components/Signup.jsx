import { useState } from 'react';
import '../assets/Login.css'
import { IoIosMail } from "react-icons/io";
import { RiLockPasswordFill } from "react-icons/ri";
import { RiUser3Fill } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import API from '../Hook/Api';
import { toast } from 'react-toastify';

function Signup() {
  const navigate = useNavigate();
  const [data, setData] = useState({ firstName: '', lastName: '', email: '', password: ''});

  const registerUser = async(e) => {
    e.preventDefault();
    const { firstName, lastName, email, password } = data
    try {
      const res = await API.post('/user', {
        firstName, lastName, email, password 
      })
      toast.success('User Registered Successfully..');
      console.log(res);
      navigate('/login');
    } catch (error) {
      toast.error(error.msg);
    }
  }

  const handleLoginClick = () => {
    navigate('/login')
  }

  return (
    <>
     <div className="container">
        <div className="login d-flex justify-content-center align-items-center">
          <div className="card p-4">
            <form onSubmit={registerUser}>
              <div className="row">
                <h1 className="text-center">REGISTER</h1>
                <div className="col-12 mt-3">
                  <div className="input-group">
                    <span className="input-group-text text-primary fs-4">
                      <RiUser3Fill />
                    </span>
                    <input
                      type="text"
                      value={data.firstName}
                      onChange={(e) =>
                        setData({ ...data, firstName: e.target.value })
                      }
                      className="form-control"
                      placeholder="First Name"
                    />
                  </div>
                </div>
                <div className="col-12 mt-3">
                  <div className="input-group">
                    <span className="input-group-text text-primary fs-4">
                      <RiUser3Fill />
                    </span>
                    <input
                      type="text"
                      value={data.lastName}
                      onChange={(e) =>
                        setData({ ...data, lastName: e.target.value })
                      }
                      className="form-control"
                      placeholder="Last Name"
                    />
                  </div>
                </div>
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
                    />
                  </div>
                </div>
                <div className="d-grid gap-2 mt-3">
                  <button className="btn btn-primary fw-bold" type="submit">
                    Register
                  </button>
                </div>
                <div className="text-center mt-3">
                  Already have an account,{" "}
                  <span className="move" onClick={handleLoginClick}>
                    Login
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default Signup