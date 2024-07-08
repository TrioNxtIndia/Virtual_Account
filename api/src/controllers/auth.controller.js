import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { ROLES } from "../utils/constant.js";
import statusCode from "../utils/statusCode.js";
import jwt from 'jsonwebtoken';

class AuthController {

  async saveAdmin(req, res) {
    const { firstName, lastName, email, password } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
    try {
      const exist = await User.findOne({ where: { email } });
      if (exist)
        return res
          .status(statusCode.CONFLICT)
          .json({ msg: "Email Already Exist!" });
      const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashPassword,
        role: ROLES.ADMIN,
      });
      await newUser.save();
      return res
        .status(statusCode.CREATED)
        .json({ msg: "User Created..", user: newUser });
    } catch (error) {
      console.log(error);
      return res.status(statusCode.BAD_GATEWAY).json({ msg: error.message });
    }
  }

  async saveUser(req, res) {
    const { firstName, lastName, email, password } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
    try {
      const exist = await User.findOne({ where: { email } });
      if (exist)
        return res
          .status(statusCode.CONFLICT)
          .json({ error: "Email Already Exist!" });
      const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashPassword,
        role: ROLES.USER,
      });
      await newUser.save();
      return res
        .status(statusCode.CREATED)
        .json({ msg: "User Created..", user: newUser });
    } catch (error) {
      console.log(error);
      return res.status(statusCode.BAD_GATEWAY).json({ msg: error.message });
    }
  }

  async login (req, res) {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email }})
        if(!user)
            return res.status(statusCode.NOT_FOUND).json({ msg: "User Not Found!"});
        const isPassCorrect = await bcrypt.compare(password, user.password);
        if(!isPassCorrect)
            return res.status(statusCode.BAD_REQUEST).json({ msg: "Invalid Password!"});
        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role},
            process.env.JWT_SECRET,
            { expiresIn: '8h'}
        )
        return res.status(statusCode.OK).json({ msg: 'Login Success..', token: token, role: user.role})
    } catch (error) {
        return res.status(statusCode.BAD_GATEWAY).json({ msg: error.message });
    }
  }
}

export default new AuthController();
