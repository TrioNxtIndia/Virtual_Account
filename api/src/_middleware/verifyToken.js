import jwt from "jsonwebtoken";
import statusCode from "../utils/statusCode.js";

export const verifyUser = (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];;
  if (!token)
    return res.status(statusCode.UNAUTHORIZED).json({ msg: "Unauthorized! Token not provided." });
  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err){
      if (err.name === 'TokenExpiredError') {
        return res.status(statusCode.UNAUTHORIZED).json({ msg: "Token Expired!" });
      }
      return res
        .status(statusCode.FORBIDDEN)
        .json({ msg: "Invalid Token!", err });
    }
    req.user = user;
    next();
  });
};

export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    const userRole = req.user.role;
    if (userRole && userRole.toLowerCase() === "admin") next();
    return res.status(statusCode.FORBIDDEN).json({ msg: "Unauthorized!" });
  });
};
