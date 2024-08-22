import { Router } from "express";

import { authenticateUser, IsAdminUser } from "./middlewares/authMiddleware";

import UserController from "./controllers/userController";
import ContractController from "./controllers/contractController";

const router = Router();
const userController = new UserController();
const contractController = new ContractController();

//CRUD para Usuário
router.post('/usuarios', authenticateUser, IsAdminUser, userController.createUser.bind(userController));
router.get('/usuarios', authenticateUser, IsAdminUser, userController.getUsers.bind(userController));
router.get('/usuarios/:userId', authenticateUser, userController.getUserById.bind(userController));
router.put('/usuarios/:userId', authenticateUser, userController.updateUser.bind(userController));
router.delete('/usuarios/:userId', authenticateUser, IsAdminUser, userController.deleteUser.bind(userController));

//CRUD para Contrato
router.post('/contratos', authenticateUser, IsAdminUser, contractController.createContract.bind(contractController));
router.get('/contratos', authenticateUser, IsAdminUser, contractController.getContracts.bind(contractController));
router.get('/contratos/:contractId', authenticateUser, contractController.getContractById.bind(contractController));
router.put('/contratos/:contractId', authenticateUser, IsAdminUser, contractController.updateContract.bind(contractController));
router.delete('/contratos/:contractId', authenticateUser, IsAdminUser, contractController.deleteContract.bind(contractController));

export { router };