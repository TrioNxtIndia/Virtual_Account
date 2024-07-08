// import { useEffect, useState } from "react";
// import API from "../Hook/Api";
// import "../assets/Home.css";

// function PlaidAuth({ bankName, publicToken }) {
//   const [accounts, setAccounts] = useState([]);
//   useEffect(() => {
//     async function fetchData() {
//       let accessToken = await API.post("/exchange_public_token", {
//         public_token: publicToken,
//         bankName: bankName
//       });
//       console.log("access-token*", accessToken);
//       const auth = await API.post("/auth", {
//         access_token: accessToken.accessToken,
//       });

//       const accountsData = auth.accounts.map((account) => ({
//         accountName: account.name,
//         accountType: `${account.type} / ${account.subtype}`,
//         accountNumber: `*** *** ${account.mask}`,
//         balance: `${account.balances.available} ${account.balances.iso_currency_code}`,
//       }));

//       setAccounts(accountsData);
//     }
//     fetchData();
//   }, [publicToken, bankName]);

//   useEffect(() => {
//     async function fetchAccounts() {
//       try {
//         const response = await API.get("/accounts");
//         console.log(response);
//         const accountsData = response.map(item => ({
//             accountName: item.accounts[0].name,
//             accountType: `${item.accounts[0].type} / ${item.accounts[0].subtype}`,
//             accountNumber: `*** *** ${item.accounts[0].mask}`,
//             balance: `${item.accounts[0].balances.available} ${item.accounts[0].balances.iso_currency_code}`,
//           }));
//         setAccounts(accountsData);
//       } catch (error) {
//         console.error("Error fetching accounts:", error.message);
//       }
//     }
//     fetchAccounts();
//   }, []);

//   return (
//     accounts && (
//       <>
//         <div className="container mt-4">
//           <div className="row">
//             {accounts.map((account, index) => (
//               <div key={index} className="col-md-4 col-12 mt-2">
//                 <div className="card card-bg">
//                   <div className="card-body">
//                     <h5 className="card-title text-center py-2">bankName</h5>
//                     <p>
//                       Account Name:{" "}
//                       <span className="fw-bold ms-2">
//                         {account.accountName}
//                       </span>
//                     </p>
//                     <p>
//                       Account Type:{" "}
//                       <span className="fw-bold ms-2">
//                         {account.accountType}
//                       </span>
//                     </p>
//                     <p>
//                       Account No:{" "}
//                       <span className="fw-bold ms-2">
//                         {account.accountNumber}
//                       </span>
//                     </p>
//                     <p>
//                       Balance:{" "}
//                       <span className="fw-bold ms-2">{account.balance}</span>
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </>
//     )
//   )
// }

// export default PlaidAuth;
