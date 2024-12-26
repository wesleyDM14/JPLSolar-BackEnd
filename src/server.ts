import express, { Request, Response, NextFunction } from "express";
import cors from 'cors';
import 'express-async-errors';

import { setupGracefulShutdown } from "./functions/shutdown";
import prismaClient from "./prisma";
import { router } from "./routes";
import { testAuthentication } from "./functions/testSicredi";

const app = express();
const PORT = process.env.PORT || 3333;

//Middleware para analisar o corpo das solicitações como JSON
app.use(express.json());

//Middleware para permitir solicitações de origens diferentes
app.use(cors());

//Middleware para registrar as rotas
app.use('/api', router);

//Middleware para tratamento de erros
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ message: 'Ocorreu um erro no servidor: ' + err.message });
});

//Rota de teste
app.get('/up', async (req, res) => {
    res.send('Servidor online!');
});

//Inicialização do servidor
const server = app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

setupGracefulShutdown(server, prismaClient);
testAuthentication();