import PDFDocument from 'pdfkit';
import extenso from 'numero-por-extenso';

import { formatDate } from './generateDateExtenso';
import prismaClient from '../prisma';

export async function generatePromissoriaPDF(contractId: string, dataCallback: any, endCallback: any) {
    try {

        const contractExisting = await prismaClient.contract.findFirst({ where: { id: contractId } });

        if (!contractExisting) {
            throw new Error('Contrato não encontrado no Banco de Dados.');
        }

        const promissoria = await prismaClient.promissoria.findFirst({ where: { contractId: contractId } });

        const enderecoCliente = await prismaClient.endereco.findFirst({ where: { id: contractExisting.enderecoId } });

        let avalista = null;
        let enderecoAvalista = null;

        if (contractExisting.avalistaId) {
            avalista = await prismaClient.avalista.findFirst({ where: { id: contractExisting.avalistaId } });
            if (avalista) {
                enderecoAvalista = await prismaClient.endereco.findFirst({ where: { id: avalista.enderecoId } });
            }
        }

        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, left: 60, right: 60, bottom: 50 }
        });

        //Conectando os callbacks aos eventos de fluxo
        doc.on('data', dataCallback);
        doc.on('end', endCallback);

        //Configuração do documento
        doc.font('Helvetica').fontSize(14);

        doc.text('NOTA PROMISSÓRIA', { align: 'center' });
        doc.moveDown();

        if (promissoria) {
            doc.text(`Nº ${promissoria.numero}/${promissoria.ano}`, { align: 'left' });
            doc.moveDown();
        }

        doc.text(`Vencimento: ${new Date(contractExisting.dataPrimeiraParcela).toLocaleDateString()}`, { align: 'left' });
        doc.moveDown();

        doc.text(`R$ ${contractExisting.priceTotal.toFixed(2)} (${extenso(contractExisting.priceTotal, { estilo: 'monetario' }).toUpperCase()}).`, { align: 'left' });
        doc.moveDown();

        const dataParcela = new Date(contractExisting.dataPrimeiraParcela);

        doc.font('Helvetica').text(`No dia `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(` ${dataParcela.getDate()}/${dataParcela.getMonth() + 1} de ${dataParcela.getFullYear()} (${formatDate(dataParcela).toUpperCase()}) `, { continued: true, align: 'justify' });
        doc.font('Helvetica').text(`pagar por esta única via de nota promissória na praça de São Miguel - RN a GURGEL AZEVEDO E TEOFILO SERVIÇOS DE ENGENHARIA LTDA, inscrito no `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(' CNPJ nº 33.651.184/0001-09 ', { continued: true, align: 'left' });
        doc.font('Helvetica').text(`ou à sua ordem a quantia de `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(` R$ ${contractExisting.priceTotal.toFixed(2)} (${extenso(contractExisting.priceTotal, { estilo: 'monetario' }).toUpperCase()})`, { continued: true, align: 'justify' });
        doc.font('Helvetica').text(`, em moeda corrente deste país.`, { align: 'justify' });
        doc.moveDown();

        doc.text(`São Miguel - RN, ${new Date(contractExisting.dataContrato).toLocaleDateString()} `, { align: 'justify' });
        doc.moveDown();
        doc.moveDown();
        doc.moveDown();
        doc.moveDown();
        doc.moveDown();
        doc.moveDown();

        doc.text(`_____________________________________________`, { align: 'center' });
        doc.text(`${contractExisting.nome.toUpperCase()}`, { align: 'center' });
        doc.text(`CPF: ${contractExisting.cpf}`, { align: 'center' });
        if (enderecoCliente) {
            doc.text(`${enderecoCliente.logradouro + ', Nº' + enderecoCliente.numero + ', ' + enderecoCliente.bairro + ', ' + enderecoCliente.cidade + ' - ' + enderecoCliente.uf + ', ' + enderecoCliente.cep}`, { align: 'center' });
            doc.moveDown();
        }

        doc.moveDown();
        doc.moveDown();
        doc.moveDown();

        //caso tenha AVALISTA
        if (avalista && enderecoAvalista) {
            doc.text(`_____________________________________________`, { align: 'center' });
            doc.text(`${avalista.nome.toUpperCase()}`, { align: 'center' });
            doc.text(`CPF: ${avalista.cpf}`, { align: 'center' });
            doc.text(`${enderecoAvalista.logradouro + ', Nº' + enderecoAvalista.numero + ', ' + enderecoAvalista.bairro + ', ' + enderecoAvalista.cidade + ' - ' + enderecoAvalista.uf + ', ' + enderecoAvalista.cep}`, { align: 'center' });
            doc.moveDown();
        }

        doc.end();
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