import { formatDate } from './generateDateExtenso';
import prismaClient from '../prisma';
import { generatePdf } from 'html-pdf-node';
import { formatCEP, formatCPF } from './formarString';

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
});

const extenso = require('numero-por-extenso');

export async function generatePromissoriaPDF(contractId: string, userId: string, callback: (err: Error | null, buffer: Buffer | null) => void) {
    try {

        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const contractExisting = await prismaClient.contract.findFirst({ where: { id: contractId } });

        if (!contractExisting) {
            throw new Error('Contrato não encontrado no Banco de Dados.');
        }

        if (existingUser.id !== contractExisting.userId && !existingUser.isAdmin) {
            throw new Error('Você não tem permissão para acessar esse contrato.');
        }

        const promissoria = await prismaClient.promissoria.findFirst({ where: { contractId: contractId } });

        if (!promissoria) {
            throw new Error('Promissoria não encontrada no Banco de Dados.');
        }

        const enderecoCliente = await prismaClient.endereco.findFirst({ where: { id: contractExisting.enderecoId } });

        if (!enderecoCliente) {
            throw new Error('Endereço não encontrado no banco de dados');
        }

        let avalista = null;
        let enderecoAvalista = null;

        if (contractExisting.avalistaId) {
            avalista = await prismaClient.avalista.findFirst({ where: { id: contractExisting.avalistaId } });
            if (avalista) {
                enderecoAvalista = await prismaClient.endereco.findFirst({ where: { id: avalista.enderecoId } });
            }
        }

        const dataParcela = new Date(contractExisting.dataPrimeiraParcela);

        const dataPrimeiraParcela = dataParcela.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const dataContrato = new Date(contractExisting.dataContrato).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const valorTotal = formatadorMoeda.format(contractExisting.priceTotal);

        const htmlContent = `
            <html>
                <head>
                    <style>
                        body {
                            font-family: 'Helvetica', sans-serif;
                            font-size: 16px;
                            line-height: 1.6;
                            margin: 50px;
                        }

                        h1 {
                            font-size: 16px;
                            text-align: center;
                        }

                        strong {
                            font-weight: bold;
                        }

                        hr {
                            margin: 50px auto 0px auto;
                            width: 70%;
                            border: none;
                            border-top: 1px solid #000;
                        }

                        .signature {
                            text-align: center;
                            margin-top: 20px !important;
                        }

                        .center-text {
                            text-align: center;
                        }

                        .contract-details {
                            margin-bottom: 30px;
                        }

                        .contract-container {
                            margin-botton: 30px;
                        }

                        .contract-container > p {
                            text-align: justify;
                        }

                        .title-container {
                            margin-bottom: 50px;
                        }
                    </style>
                </head>
                <body>
                    <div class="title-container">
                        <h1>NOTA PROMISSÓRIA</h1>
                    </div>
                    <div class="contract-details">
                        <p>Nº ${promissoria.numero}/${promissoria.ano}</p>
                        <p>Vencimento: ${dataPrimeiraParcela}</p>
                        <p>${valorTotal} (${extenso.porExtenso(contractExisting.priceTotal, extenso.estilo.monetario).toUpperCase()}).</p>
                    </div>
                    <div class="contract-container">
                        <p>No dia <strong>${dataParcela.getDate().toString().padStart(2, '0')} / ${(dataParcela.getMonth() + 1).toString().padStart(2, '0')} de ${dataParcela.getFullYear()} (${formatDate(dataParcela).toUpperCase()})</strong> pagar por esta única via de nota promissória na praça de São Miguel - RN a GURGEL AZEVEDO E TEOFILO SERVIÇOS DE ENGENHARIA LTDA, inscrito no <strong>CNPJ nº 33.651.184/0001-09</strong> ou à sua ordem a quantia de <strong>${valorTotal} (${extenso.porExtenso(contractExisting.priceTotal, extenso.estilo.monetario).toUpperCase()})</strong>, em moeda corrente deste país.</p>
                    </div>
                    <div class="contract-details">
                        <p>São Miguel - RN, ${dataContrato}</p>
                    </div>
                    <br/>
                    <div class="signature">
                        <hr />
                        <p>${contractExisting.nome.toUpperCase()}</p>
                        <p>CPF: ${formatCPF(contractExisting.cpf)}</p>
                        <p>${enderecoCliente.logradouro + ', Nº' + enderecoCliente.numero + ', ' + enderecoCliente.bairro + ', ' + enderecoCliente.cidade + ' - ' + enderecoCliente.uf + ', ' + formatCEP(enderecoCliente.cep)}</p>
                    </div>
                    <br/>
                    ${avalista && enderecoAvalista ?
                            `<div class="signature">
                                <hr />
                                <p>${avalista.nome.toUpperCase()}</p>
                                <p>CPF: ${formatCPF(avalista.cpf)}</p>
                                <p>${enderecoAvalista.logradouro + ', Nº' + enderecoAvalista.numero + ', ' + enderecoAvalista.bairro + ', ' + enderecoAvalista.cidade + ' - ' + enderecoAvalista.uf + ', ' + formatCEP(enderecoAvalista.cep)}</p>
                            </div>`
                        :
                            ''
            }
                </body>
            </html>
        `;

        const options = { format: 'A4' };
        const file = { content: htmlContent };

        const pdfBuffer = generatePdf(file, options, (err, buffer) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, buffer);
        });

        return pdfBuffer;

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Erro ao gerar PDF do contrato: ' + error.message);
            throw new Error('Erro ao gerar PDF do contrato: ' + error.message);
        } else {
            console.error('Erro ao gerar PDF do contrato: Erro desconhecido');
            throw new Error('Erro ao gerar PDF do contrato: Erro desconhecido');
        }
    }
}