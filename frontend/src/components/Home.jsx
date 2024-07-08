import { useEffect, useState } from "react";
import "../assets/Home.css";
import API from "../Hook/Api";
import { usePlaidLink } from "react-plaid-link";
import image from "../assets/images/not_found.svg";
import { ClimbingBoxLoader } from "react-spinners";

function Home() {
  const [linkToken, setLinkToken] = useState();
  const [publicToken, setPublicToken] = useState();
  const [bankName, setBankName] = useState();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 5000);
  }, []);

  useEffect(() => {
    async function fetch() {
      const res = await API.post("/create_link_token");
      setLinkToken(res.link_token);
    }
    fetch();
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      setBankName(metadata.institution.name);
      setPublicToken(public_token);
    },
  });

  useEffect(() => {
    async function fetchData() {
      let accessToken = await API.post("/exchange_public_token", {
        public_token: publicToken,
        bankName: bankName,
      });
      console.log("access-token*", accessToken);
    }
    fetchData();
  }, [publicToken, bankName]);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await API.get("/accounts");
        console.log(response);
        const accountsData = response.map((item) => ({
          accountName: item.accounts[0].name,
          accountType: `${item.accounts[0].type} / ${item.accounts[0].subtype}`,
          accountNumber: `**** **** ${item.accounts[0].mask}`,
          balance: `${item.accounts[0].balances.available} ${item.accounts[0].balances.iso_currency_code}`,
        }));
        setAccounts(accountsData);
      } catch (error) {
        console.error("Error fetching accounts:", error.message);
      }
    }
    fetchAccounts();
  }, []);

  return (
    <>
      <div className="container py-4">
        <div className="actions">
          <button
            className="btn btn-success me-3"
            onClick={() => open()}
            disabled={!ready}
          >
            Connect To Bank
          </button>
          <button className="btn btn-warning">Make A Transaction</button>
        </div>
      </div>

      {loading ? (
        <>
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
            <ClimbingBoxLoader
                color={"#6f36d6"}
                size={20}
            />
        </div>
        <h5 className="text-center" style={{marginTop: "-100px"}}>Loading...</h5>
    </>
      ):
      (
        <>
          {accounts.length ? (
        <>
          <div className="container mt-4">
            <div className="row">
              {accounts.map((account, index) => (
                <div key={index} className="col-md-4 col-12 mt-2">
                  <div className="card card-bg">
                    <div className="card-body">
                      <h5 className="card-title text-center py-2">Bank Name</h5>
                      {/* <p>
                        Account Name:{" "}
                        <span className="fw-bold ms-2">
                          {account.accountName}
                        </span>
                      </p> */}
                      <p>
                        Account Type:{" "}
                        <span className="fw-bold ms-2">
                          {account.accountType}
                        </span>
                      </p>
                      <p>
                        Account No:{" "}
                        <span className="fw-bold ms-2">
                          {account.accountNumber}
                        </span>
                      </p>
                      <p>
                        Balance:{" "}
                        <span className="fw-bold ms-2">{account.balance}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div
          className="container d-flex justify-content-center align-items-center not-found"
          style={{ minHeight: "60vh" }}
        >
          <div className="text-center">
            <img src={image} alt="" height="150px" />
            <h4 className="mt-3 text-danger">Not Found !</h4>
          </div>
        </div>
      )}
        </>
      )}

      
    </>
  );
}

export default Home;
