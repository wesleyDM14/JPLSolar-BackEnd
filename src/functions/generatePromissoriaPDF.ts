import PDFDocument from 'pdfkit';
import { formatDate } from './generateDateExtenso';
import prismaClient from '../prisma';


const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
});

const extenso = require('numero-por-extenso');

export async function generatePromissoriaPDF(contractId: string, userId: string, dataCallback: any, endCallback: any) {
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

        doc.text(`Vencimento: ${dataPrimeiraParcela}`, { align: 'left' });
        doc.moveDown();

        doc.text(`${valorTotal} (${extenso.porExtenso(contractExisting.priceTotal, extenso.estilo.monetario).toUpperCase()}).`, { align: 'left' });
        doc.moveDown();

        doc.font('Helvetica').text(`No dia `, { continued: true, align: 'justify' })
            .font('Helvetica-Bold').text(` ${dataParcela.getDate().toString().padStart(2, '0')} / ${(dataParcela.getMonth() + 1).toString().padStart(2, '0')} de ${dataParcela.getFullYear()} (${formatDate(dataParcela).toUpperCase()}) `, { continued: true })
            .font('Helvetica').text(`pagar por esta única via de nota promissória na praça de São Miguel - RN a GURGEL AZEVEDO E TEOFILO SERVIÇOS DE ENGENHARIA LTDA, inscrito no `, { continued: true })
            .font('Helvetica-Bold').text(' CNPJ nº 33.651.184/0001-09 ', { continued: true })
            .font('Helvetica').text(` ou à sua ordem a quantia de `, { continued: true })
            .font('Helvetica-Bold').text(` ${valorTotal} (${extenso.porExtenso(contractExisting.priceTotal, extenso.estilo.monetario).toUpperCase()})`, { continued: true })
            .font('Helvetica').text(`, em moeda corrente deste país.`);
        doc.moveDown();

        doc.text(`São Miguel - RN, ${dataContrato} `, { align: 'justify' });
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