import { where } from "sequelize";
import User from "../models/User.js";
import statusCode from "../utils/statusCode.js";

class UserController {

    async getById(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findByPk(userId);
            if(!user)
                return res.status(statusCode.NOT_FOUND).json({ msg: 'User Not Found!'});
            return res.status(statusCode.OK).json({ msg: "User Found..", User: user})
        } catch (error) {
            console.log(error);
            return res.status(statusCode.BAD_GATEWAY).json({ msg: error.message });
        }
    }

    async update(req, res) {
        try {
            const userId = req.params.id; 
            const user = await User.findByPk(userId);
            if(!user)
                return res.status(statusCode.NOT_FOUND).json({ msg: 'User Not Found!'});
            await User.update(req.body, { where: { id: userId }})
            const updateUser = await User.findByPk(userId);
            return res.status(statusCode.OK).json({ msg: "User Updated..", User: updateUser})
        } catch (error) {
            return res.status(statusCode.BAD_GATEWAY).json({ msg: error.message });
        }
    }

    async remove(req, res) {
        try {
            const userId = req.params.id; 
            const user = await User.findByPk(userId);
            if(!user)
                return res.status(statusCode.NOT_FOUND).json({ msg: 'User Not Found!'});
            await User.destroy({ where: {id: userId} });
            return res.status(statusCode.OK).json({ msg: "User Removed.."})
        } catch (error) {
            return res.status(statusCode.BAD_GATEWAY).json({ msg: error.message });
        }
    }
}

export default new UserController();