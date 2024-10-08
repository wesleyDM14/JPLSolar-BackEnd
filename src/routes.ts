import { Router } from "express";

import { authenticateUser, IsAdminUser } from "./middlewares/authMiddleware";

import UserController from "./controllers/userController";
import ClientController from "./controllers/clientController";
import ContractController from "./controllers/contractController";
import SolarPlantController from "./controllers/solarPlantController";
import DashboardController from "./controllers/dashboardController";
import WarningController from "./controllers/warningController";

const router = Router();
const userController = new UserController();
const clientController = new ClientController();
const solarPlantController = new SolarPlantController();
const contractController = new ContractController();
const dashboardController = new DashboardController();
const warningController = new WarningController();

//CRUD para Usuário
router.post('/login', userController.authenticateUser.bind(userController));
router.post('/usuarios', authenticateUser, IsAdminUser, userController.createUser.bind(userController));
router.get('/usuarios', authenticateUser, IsAdminUser, userController.getUsers.bind(userController));
router.get('/usuarios/:userId', authenticateUser, userController.getUserById.bind(userController));
router.get('/meu-perfil', authenticateUser, userController.getUserLoggedIn.bind(userController));
router.put('/usuarios/:userId', authenticateUser, userController.updateUser.bind(userController));
router.delete('/usuarios/:userId', authenticateUser, IsAdminUser, userController.deleteUser.bind(userController));

//CRUD para Cliente
router.post('/clientes', authenticateUser, clientController.createClient.bind(clientController));
router.get('/clientes', authenticateUser, IsAdminUser, clientController.getClients.bind(clientController));
router.get('/clientes/:clientId', authenticateUser, clientController.getClientById.bind(clientController));
router.get('/myClients', authenticateUser, clientController.getSelfUserClients.bind(clientController));
router.get('/users/:userId/clients', authenticateUser, IsAdminUser, clientController.getClientsByUserId.bind(clientController));
router.put('/clientes/:clientId', authenticateUser, clientController.updateClient.bind(clientController));
router.delete('/clientes/:clientId', authenticateUser, clientController.deleteClient.bind(clientController));

//CRUD para Planta Solar
router.post('/plantasSolar', authenticateUser, solarPlantController.createSolarPlant.bind(solarPlantController));
router.get('/plantasSolar', authenticateUser, IsAdminUser, solarPlantController.getSolarPlants.bind(solarPlantController));
router.get('/mySolarPlants', authenticateUser, solarPlantController.getSelfSolarPlants.bind(solarPlantController));
router.get('/users/:userId/solarPlants', authenticateUser, IsAdminUser, solarPlantController.getSolarPlantsByUserId.bind(solarPlantController));
router.get('/clients/:clientId/solarPlants', authenticateUser, solarPlantController.getSolarPlantsByClientId.bind(solarPlantController));
router.get('/plantasSolar/:solarPlantId', authenticateUser, solarPlantController.getSolarPlantById.bind(solarPlantController));
router.get('/params/:login/:password/:inverter', authenticateUser, solarPlantController.getSolarPlantParams.bind(solarPlantController));
router.put('/plantasSolar/:solarPlantId', authenticateUser, solarPlantController.updateSolarPlant.bind(solarPlantController));
router.delete('/plantasSolar/:solarPlantId', authenticateUser, solarPlantController.deleteSolarPlant.bind(solarPlantController));

//CRUD para Contrato
router.post('/contratos', authenticateUser, contractController.createContract.bind(contractController));
router.get('/contratos', authenticateUser, IsAdminUser, contractController.getContracts.bind(contractController));
router.get('/contratos/:contractId', authenticateUser, contractController.getContractById.bind(contractController));
router.get('/myContracts', authenticateUser, contractController.getSelfUserContracts.bind(contractController));
router.get('/users/:userId/contracts', authenticateUser, IsAdminUser, contractController.getContractsByUser.bind(contractController));
router.get('/contratos/:contractId/pdf', authenticateUser, contractController.generateContractpdf.bind(contractController));
router.get('/contratos/:contractId/promissoria/pdf', authenticateUser, contractController.generatePromissoriaPDF.bind(contractController));
router.put('/contratos/:contractId', authenticateUser, contractController.updateContract.bind(contractController));
router.delete('/contratos/:contractId', authenticateUser, contractController.deleteContract.bind(contractController));

//rotas para Dashboard
router.get('/dashboardData', authenticateUser, dashboardController.getDashboardData.bind(dashboardController));

//rotas para Avisos
router.post('/avisos', authenticateUser, IsAdminUser, warningController.createWarning.bind(warningController));
router.get('/avisos', authenticateUser, IsAdminUser, warningController.getWarnings.bind(warningController));
router.get('/users/:userId/warnings', authenticateUser, warningController.getWarningByUserId.bind(warningController));
router.get('/myWarnings', authenticateUser, warningController.getWarningByUserLoggedIn.bind(warningController));
router.get('/avisos/:warningId', authenticateUser, warningController.getWarningById.bind(warningController));
router.put('/avisos/:warningId', authenticateUser, warningController.updateWarning.bind(warningController));
router.delete('/avisos/:warningId', authenticateUser, warningController.deleteWarning.bind(warningController));

export { router };