import { Request, Response } from "express";
import { sicrediBoletoService } from "../services/SicrediBoletoService";

export class BoletoController {
    async gerarBoleto(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const boletoData = req.body;

            const boleto = await sicrediBoletoService.gerarBoleto(userId, boletoData);

            res.json(boleto);
        } catch (error: any) {
            res.status(400).json({
                error: 'Erro ao gerar boleto',
                details: error.message
            });
        }
    }
}

export const boletoController = new BoletoController();