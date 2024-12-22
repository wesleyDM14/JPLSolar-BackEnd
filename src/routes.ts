import { Router } from "express";

import { authenticateUser, IsAdminUser } from "./middlewares/authMiddleware";

import UserController from "./controllers/userController";
import ClientController from "./controllers/clientController";
import ContractController from "./controllers/contractController";
import SolarPlantController from "./controllers/solarPlantController";
import DashboardController from "./controllers/dashboardController";
import WarningController from "./controllers/warningController";
import PartnerController from "./controllers/partnerController";
import ParcelaController from "./controllers/parcelaController";
import TasksController from "./controllers/tasksController";

const router = Router();
const userController = new UserController();
const clientController = new ClientController();
const solarPlantController = new SolarPlantController();
const contractController = new ContractController();
const dashboardController = new DashboardController();
const warningController = new WarningController();
const partnerController = new PartnerController();
const parcelaController = new ParcelaController();
const tasksController = new TasksController();

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
router.post('/params/solarPlant', authenticateUser, solarPlantController.getSolarPlantParams.bind(solarPlantController));
router.post('/plantasSolar/errorList', authenticateUser, solarPlantController.getErrorList.bind(solarPlantController));
router.post('/plantasSolar/getChartsByType', authenticateUser, solarPlantController.getChartByType.bind(solarPlantController));
router.post('/plantaSolar/:solarPlantId/pdf', authenticateUser, solarPlantController.getReportBySolarPlant.bind(solarPlantController));
router.get('/plantasSolar', authenticateUser, IsAdminUser, solarPlantController.getSolarPlants.bind(solarPlantController));
router.get('/mySolarPlants', authenticateUser, solarPlantController.getSelfSolarPlants.bind(solarPlantController));
router.get('/users/:userId/solarPlants', authenticateUser, IsAdminUser, solarPlantController.getSolarPlantsByUserId.bind(solarPlantController));
router.get('/clients/:clientId/solarPlants', authenticateUser, solarPlantController.getSolarPlantsByClientId.bind(solarPlantController));
router.get('/plantasSolar/:solarPlantId', authenticateUser, solarPlantController.getSolarPlantById.bind(solarPlantController));
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

//rotas para Parceiros
router.post('/parceiros', authenticateUser, partnerController.createPartner.bind(partnerController));
router.get('/parceiros', authenticateUser, IsAdminUser, partnerController.getPartners.bind(partnerController));
router.get('/users/:userId/parceiros', authenticateUser, partnerController.getPartnersByUserId.bind(partnerController));
router.get('/myPartners', authenticateUser, partnerController.getPartnersByUserLoggedIn.bind(partnerController));
router.get('/parceiros/:partnerId', authenticateUser, partnerController.getPartnerById.bind(partnerController));
router.put('/parceiros/:partnerId', authenticateUser, partnerController.updatePartner.bind(partnerController));
router.delete('/parceiros/:partnerId', authenticateUser, partnerController.deletePartner.bind(partnerController));

//rotas para parcela
router.post('/parcelas', authenticateUser, parcelaController.createParcela.bind(parcelaController));
router.get('/parcelas', authenticateUser, IsAdminUser, parcelaController.getParcelas.bind(parcelaController));
router.get('/users/:userId/parcelas', authenticateUser, parcelaController.getParcelasByUserId.bind(parcelaController));
router.get('/myParcels', authenticateUser, parcelaController.getParcelasByUserLoggedIn.bind(parcelaController));
router.get('/clients/:clientId/parcelas', authenticateUser, parcelaController.getParcelasByClientId.bind(parcelaController));
router.get('parcelas/:parcelaId', authenticateUser, parcelaController.getParcelaById.bind(parcelaController));
router.put('/parcelas/:parcelaId', authenticateUser, parcelaController.updateParcela.bind(parcelaController));
router.delete('/parcelas/:parcelaId', authenticateUser, parcelaController.deleteParcela.bind(parcelaController));

//rotas para tarefas
router.post('/columns', authenticateUser, tasksController.createColumn.bind(tasksController));
router.post('/tasks', authenticateUser, tasksController.createTask.bind(tasksController));
router.get('/columns', authenticateUser, tasksController.getColumnsByUserId.bind(tasksController));
router.put('/tasks/:taskId', authenticateUser, tasksController.updateTask.bind(tasksController));
router.delete('/columns/:columnId', authenticateUser, tasksController.deleteColumn.bind(tasksController));
router.delete('/tasks/:taskId', authenticateUser, tasksController.deleteTask.bind(tasksController));

export { router };