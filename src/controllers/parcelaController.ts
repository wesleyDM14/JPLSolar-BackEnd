import { Request, Response } from "express";
import ParcelaService from "../services/parcelaService";
import { sicrediBoletoService } from "../Api/services/SicrediBoletoService";

const parcelaService = new ParcelaService();

class ParcelaController {

    async createParcela(req: Request, res: Response) {

    }

    async getParcelas(req: Request, res: Response) {

    }

    async getParcelasByClientId(req: Request, res: Response) {

    }

    async getParcelasByUserLoggedIn(req: Request, res: Response) {

    }

    async getParcelasByUserId(req: Request, res: Response) {

    }

    async getParcelaById(req: Request, res: Response) {

    }

    async updateParcela(req: Request, res: Response) {

    }

    async deleteParcela(req: Request, res: Response) {

    }

}

export default ParcelaController;