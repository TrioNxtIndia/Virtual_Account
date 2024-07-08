import { RiLogoutCircleRLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold ms-2" href="/">
            Virtual Account
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {/* <li className="nav-item">
                <a className="nav-link active" aria-current="page" href="/account">
                  Accounts
                </a>
              </li> */}
            </ul>
            <form className="d-flex me-3">
              <button className="btn btn-danger fw-bold d-flex align-items-center p-2 fs-5"
              onClick={handleLogout}>
                <RiLogoutCircleRLine />
              </button>
            </form>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
