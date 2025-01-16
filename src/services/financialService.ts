import prismaClient from "../prisma";

class FinancialService {

    async getResume(userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const parcelas = await prismaClient.parcela.findMany({
            where: {
                client: {
                    montadorId: userId,
                }
            },
            include: {
                client: true
            }
        });

        let recebido = 0;
        let num_pagos = 0;
        let a_receber = 0;
        let num_receber = 0;
        let vencidas = 0;
        let num_vencidas = 0;
        let a_vencer = 0;
        let num_avencer = 0;

        parcelas.forEach(element => {
            if (element.status === 'AGUARDANDO') {
                a_receber += element.valor;
                num_receber += 1;
                a_vencer += element.valor;
                num_avencer += 1;
            } else if (element.status === 'PAGO') {
                recebido += element.valor;
                num_pagos += 1;
            } else {
                vencidas += element.valor;
                num_vencidas += 1;
            }
        });

        let response = {
            recebido,
            num_pagos,
            a_receber,
            num_receber,
            vencidas,
            num_vencidas,
            a_vencer,
            num_avencer,
        };

        return response;
    }

    async creteConta() {

    }

    async getContaByUser() {

    }

    async updateConta() {

    }

    async deleteConta() {

    }

}

export default FinancialService;