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

    async imprimirBoleto(req: Request, res: Response) {
        try {
            const { linhaDigitavel } = req.query;
            const userId = req.user?.id;

            const pdfBuffer = await sicrediBoletoService.imprimirBoleto(userId, linhaDigitavel as string);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=boleto.pdf');
            res.send(pdfBuffer);
        } catch (error: any) {
            res.status(400).json({ message: `Erro ao imprimir Boleto: ${error.message}` });
        }
    }
}

export const boletoController = new BoletoController();