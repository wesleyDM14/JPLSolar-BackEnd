import { Router } from "express";

import ContractController from "./controllers/contractController";
import { authenticateUser, IsAdminUser } from "./middlewares/authMiddleware";

const router = Router();
const contractController = new ContractController();

//CRUD para Contrato
router.post('/contratos', authenticateUser, IsAdminUser, contractController.createContract.bind(contractController));
router.get('/contratos', authenticateUser, IsAdminUser, contractController.getContracts.bind(contractController));
router.get('/contratos/:contractId', authenticateUser, contractController.getContractById.bind(contractController));
router.put('/contratos/:contractId', authenticateUser, IsAdminUser, contractController.updateContract.bind(contractController));
router.delete('/contratos/:contractId', authenticateUser, IsAdminUser, contractController.deleteContract.bind(contractController));

export { router };