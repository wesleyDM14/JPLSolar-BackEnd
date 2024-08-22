import { Router } from "express";

import { authenticateUser, IsAdminUser } from "./middlewares/authMiddleware";

import UserController from "./controllers/userController";
import ClientController from "./controllers/clientController";
import ContractController from "./controllers/contractController";

const router = Router();
const userController = new UserController();
const clientController = new ClientController();
const contractController = new ContractController();

//CRUD para Usuário
router.post('/usuarios', authenticateUser, IsAdminUser, userController.createUser.bind(userController));
router.get('/usuarios', authenticateUser, IsAdminUser, userController.getUsers.bind(userController));
router.get('/usuarios/:userId', authenticateUser, userController.getUserById.bind(userController));
router.put('/usuarios/:userId', authenticateUser, userController.updateUser.bind(userController));
router.delete('/usuarios/:userId', authenticateUser, IsAdminUser, userController.deleteUser.bind(userController));

//CRUD para Cliente
router.post('/clientes', authenticateUser, clientController.createClient.bind(clientController));
router.get('/clientes', authenticateUser, IsAdminUser, clientController.getClients.bind(clientController));
router.get('/clientes/:clientId', authenticateUser, clientController.getClientById.bind(clientController));
router.get('/users/:userId/clients', authenticateUser, clientController.getClientsByUserId.bind(clientController));
router.put('/clientes/:clientId', authenticateUser, clientController.updateClient.bind(clientController));
router.delete('/clientes/:clientId', authenticateUser, clientController.deleteClient.bind(clientController));

//CRUD para Contrato
router.post('/contratos', authenticateUser, contractController.createContract.bind(contractController));
router.get('/contratos', authenticateUser, IsAdminUser, contractController.getContracts.bind(contractController));
router.get('/contratos/:contractId', authenticateUser, contractController.getContractById.bind(contractController));
router.get('/users/:userId/contracts', authenticateUser, contractController.getContractsByUser.bind(contractController));
router.get('/contratos/:contractId/pdf', authenticateUser, contractController.generateContractpdf.bind(contractController));
router.get('/contratos/:contractId/promissoria/pdf', authenticateUser, contractController.generatePromissoriaPDF.bind(contractController));
router.put('/contratos/:contractId', authenticateUser, contractController.updateContract.bind(contractController));
router.delete('/contratos/:contractId', authenticateUser, contractController.deleteContract.bind(contractController));

export { router };