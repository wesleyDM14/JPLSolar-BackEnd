import { Server } from 'http';
import { PrismaClient } from '@prisma/client';

export function setupGracefulShutdown(server: Server, prisma: PrismaClient) {
    const shutdown = async (signal: string) => {
        console.log(`Recebendo ${signal}. Desconectando do Prisma...`);
        await prisma.$disconnect();
        server.close(() => {
            console.log('Servidor encerrado.');
            process.exit(0);
        });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('uncaughtException', async (err) => {
        console.error('Exceção não tratada. Desconectando do Prisma...', err);
        await prisma.$disconnect();
        server.close(() => {
            console.log('Servidor encerrado devido a uma exceção não tratada.');
            process.exit(1);
        });
    });
}