import { Request, Response } from "express";

import FinancialService from "../services/financialService";

const financialService = new FinancialService();

class FinancialController {

    async getResume(req: Request, res: Response) {
        const resume = await financialService.getResume(req.user.id);

        return res.status(200).json(resume);
    }
}

export default FinancialController;