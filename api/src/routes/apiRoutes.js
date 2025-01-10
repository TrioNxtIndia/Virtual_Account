import express from 'express';
import cors from 'cors';
import authController from '../controllers/auth.controller.js';
import userController from '../controllers/user.controller.js';
import { verifyUser } from '../_middleware/verifyToken.js';
import accountController from '../controllers/account.controller.js';
import tranferController from '../controllers/tranfer.controller.js';

const router = express.Router();

router.use(
    cors({
        credentials: true,
        origin: 'http://localhost:5173'
    })
)

// Auth Routes
router.route('/admin').post(authController.saveAdmin);
router.route('/login').post(authController.login);
router.route('/user')
.post(authController.saveUser)
.get(verifyUser, userController.getById);

// User Routes
router.route('/user/:id')
.put(verifyUser, userController.update)
.delete(verifyUser, userController.remove);

// Account Routes
router.route('/create_link_token')
.post(verifyUser, accountController.createLinkToken)

router.route('/exchange_public_token')
.post(verifyUser, accountController.exchangePublicToken)

router.route('/auth').post(verifyUser, accountController.auth)
router.route('/accounts').get(verifyUser, accountController.getAccounts)

// Transfer API 
router.route('/transfer').get(verifyUser, tranferController.transferAuth)

export default router;