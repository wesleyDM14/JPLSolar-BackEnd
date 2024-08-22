import { Request, Response } from "express";

import ContractService from "../services/contractService";
import { generateContractPDF } from "../functions/generateContractPDF";
import { generatePromissoriaPDF } from "../functions/generatePromissoriaPDF";

const contractService = new ContractService();

class ContractController {

    async createContract(req: Request, res: Response) {
        try {
            const {
                nome,
                email,
                profissao,
                estadoCivil,
                dataNascimento,
                cpf,
                rg,
                dataContrato,
                carencia,
                dataPrimeiraParcela,
                quantParcelas,
                priceTotal,
                priceParcela,
                modeloModulos,
                potModulos,
                modeloInversor,
                potInversor,
                avalista,
                logradouro,
                numero,
                bairro,
                cidade,
                uf,
                cep,
                nomeAvalista,
                profissaoAvalista,
                cpfAvalista,
                logradouroAvalista,
                numeroAvalista,
                bairroAvalista,
                cidadeAvalista,
                ufAvalista,
                cepAvalista,
            } = req.body;

            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem cadastrar contratos.' });
            }

            if (!nome || !email || !profissao || !estadoCivil || !dataNascimento || !cpf || !rg || !logradouro || (numero === null || numero === undefined) || !bairro || !cidade || !uf || !cep) {
                return res.status(400).json({ message: 'Por favor, informe os dados pessoais do cliente corretamente.' });
            }

            if (!dataContrato || (carencia === null || carencia === undefined) || !dataPrimeiraParcela || (quantParcelas === null || quantParcelas === undefined) || (priceTotal === null || priceTotal === undefined) || (priceParcela === null || priceParcela === undefined)) {
                return res.status(400).json({ message: 'Por favor, informe os dados financeiros do contrato corretamente.' });
            }

            if (!modeloInversor || !modeloModulos || (potInversor === null || potInversor === undefined) || (potModulos === null || potModulos === undefined)) {
                return res.status(400).json({ message: 'Por favor, informe os dados tecnicos do contrato corretamente.' });
            }

            if (avalista && (!nomeAvalista || !profissaoAvalista || !cpfAvalista || !logradouroAvalista || (numeroAvalista === null || numeroAvalista === undefined) || !bairroAvalista || !cidadeAvalista || !ufAvalista || !cepAvalista)) {
                return res.status(400).json({ message: 'Por favor, informe os dados do avalista corretamente.' });
            }

            const newContract = await contractService.createContract(nome, email, profissao, estadoCivil, dataNascimento, cpf, rg, dataContrato, carencia, dataPrimeiraParcela, quantParcelas, priceTotal, priceParcela, modeloModulos, potModulos, modeloInversor, potInversor, avalista, logradouro, numero, bairro, cidade, uf, cep, nomeAvalista, profissaoAvalista, cpfAvalista, logradouroAvalista, numeroAvalista, bairroAvalista, cidadeAvalista, ufAvalista, cepAvalista, req.user.id);

            return res.status(201).json(newContract);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro cadastrar o contrato: ' + error.message);
                res.status(500).json({ message: 'Erro cadastrar o contrato: ' + error.message });
            } else {
                console.error('Erro cadastrar o contrato: Erro desconhecido.');
                res.status(500).json({ message: 'Erro cadastrar o contrato: Erro desconhecido.' });
            }
        }
    }

    async getContracts(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem acessar todos os contratos.' });
            }
            const contracts = await contractService.getContracts();
            return res.status(200).json(contracts);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar todos os contratos: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar todos os contratos: ' + error.message });
            } else {
                console.error('Erro ao pegar todos os contratos: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar todos os contratos: Erro desconhecido.' });
            }
        }
    }

    async getContractsByUser(req: Request, res: Response) {
        try {
            const contracts = await contractService.getContractsByUser(req.user.id);
            return res.status(200).json(contracts);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar todos os contratos do usuário: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar todos os contratos do usuário: ' + error.message });
            } else {
                console.error('Erro ao pegar todos os contratos do usuário: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar todos os contratos do usuário: Erro desconhecido.' });
            }
        }
    }

    async getContractById(req: Request, res: Response) {
        try {
            const contractId = req.params.contractId;

            if (!contractId) {
                return res.status(400).json({ message: 'ID de contrato não fornecido' });
            }

            const contract = await contractService.getContractById(contractId);
            return res.status(200).json(contract);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar o contrato: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar o contrato: ' + error.message });
            } else {
                console.error('Erro ao pegar o contrato: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar o contrato: Erro desconhecido.' });
            }
        }
    }

    async updateContract(req: Request, res: Response) {
        try {
            const contratoId = req.params.contractId;

            if (!contratoId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem atualizar contratos.' });
            }

            const {
                nome,
                email,
                profissao,
                estadoCivil,
                dataNascimento,
                cpf,
                rg,
                dataContrato,
                carencia,
                dataPrimeiraParcela,
                quantParcelas,
                priceTotal,
                priceParcela,
                modeloModulos,
                potModulos,
                modeloInversor,
                potInversor,
                avalista,
                logradouro,
                numero,
                bairro,
                cidade,
                uf,
                cep,
                nomeAvalista,
                profissaoAvalista,
                cpfAvalista,
                logradouroAvalista,
                numeroAvalista,
                bairroAvalista,
                cidadeAvalista,
                ufAvalista,
                cepAvalista,
            } = req.body;

            if (!nome || !email || !profissao || !estadoCivil || !dataNascimento || !cpf || !rg || !logradouro || (numero === null || numero === undefined) || !bairro || !cidade || !uf || !cep) {
                return res.status(400).json({ message: 'Por favor, informe os dados pessoais do cliente corretamente.' });
            }

            if (!dataContrato || (carencia === null || carencia === undefined) || !dataPrimeiraParcela || (quantParcelas === null || quantParcelas === undefined) || (priceTotal === null || priceTotal === undefined) || (priceParcela === null || priceParcela === undefined)) {
                return res.status(400).json({ message: 'Por favor, informe os dados financeiros do contrato corretamente.' });
            }

            if (!modeloInversor || !modeloModulos || (potInversor === null || potInversor === undefined) || (potModulos === null || potModulos === undefined)) {
                return res.status(400).json({ message: 'Por favor, informe os dados tecnicos do contrato corretamente.' });
            }

            if (avalista && (!nomeAvalista || !profissaoAvalista || !cpfAvalista || !logradouroAvalista || (numeroAvalista === null || numeroAvalista === undefined) || !bairroAvalista || !cidadeAvalista || !ufAvalista || !cepAvalista)) {
                return res.status(400).json({ message: 'Por favor, informe os dados do avalista corretamente.' });
            }

            const updatedContract = await contractService.updateContract(contratoId, nome, email, profissao, estadoCivil, dataNascimento, cpf, rg, dataContrato, carencia, dataPrimeiraParcela, quantParcelas, priceTotal, priceParcela, modeloModulos, potModulos, modeloInversor, potInversor, avalista, logradouro, numero, bairro, cidade, uf, cep, nomeAvalista, profissaoAvalista, cpfAvalista, logradouroAvalista, numeroAvalista, bairroAvalista, cidadeAvalista, ufAvalista, cepAvalista);

            return res.status(200).json(updatedContract);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao atualizar o contrato: ' + error.message);
                res.status(500).json({ message: 'Erro ao atualizar o contrato: ' + error.message });
            } else {
                console.error('Erro ao atualizar o contrato: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao atualizar o contrato: Erro desconhecido.' });
            }
        }
    }

    async deleteContract(req: Request, res: Response) {
        try {
            const contratoId = req.params.contractId;

            if (!contratoId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem deletar contratos.' });
            }

            await contractService.deleteContract(contratoId);
            return res.status(200).json({ message: 'Contrato deletado com sucesso.' });

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao deletar o contrato: ' + error.message);
                res.status(500).json({ message: 'Erro ao deletar o contrato: ' + error.message });
            } else {
                console.error('Erro ao deletar o contrato: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao deletar o contrato: Erro desconhecido.' });
            }
        }
    }

    async generateContractpdf(req: Request, res: Response) {
        const contractId = req.params.contractId;

        if (!contractId) {
            return res.status(400).json({ message: 'ID de contrato não fornecido.' });
        }

        try {
            const stream = res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=contrato.pdf',
            });

            await generateContractPDF(
                contractId,
                (data: any) => stream.write(data),
                () => stream.end()
            );

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao gerar PDF do contrato: ' + error.message);
                res.status(500).json({ message: 'Erro ao gerar PDF do contrato: ' + error.message });
            } else {
                console.error('Erro ao gerar PDF do contrato: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao gerar PDF do contrato: Erro desconhecido.' });
            }
        }
    }

    async generatePromissoriaPDF(req: Request, res: Response) {
        const contractId = req.params.contractId;

        if (!contractId) {
            return res.status(400).json({ message: 'ID de contrato não fornecido.' });
        }

        try {
            const stream = res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=promissoria.pdf',
            });

            await generatePromissoriaPDF(
                contractId,
                (data: any) => stream.write(data),
                () => stream.end()
            );

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao gerar PDF da promissoria: ' + error.message);
                res.status(500).json({ message: 'Erro ao gerar PDF da promissoria: ' + error.message });
            } else {
                console.error('Erro ao gerar PDF do contrato: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao gerar PDF do contrato: Erro desconhecido.' });
            }
        }
    }
}

export default ContractController;