import Account from "../models/Account.js";

class TransferController {

    async transferAuth(req, res) {
        const userId = req.user.id;
        try {
            const data = await Account.findAndCountAll({ where: { userId}})
            console.log('data', data);
        } catch (error) {
            console.log(error);
        }
    }

}

export default new TransferController();

