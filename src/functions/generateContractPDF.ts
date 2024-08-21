import PDFDocument from 'pdfkit';
import { addMonths } from 'date-fns';
import extenso from 'numero-por-extenso';

import prismaClient from '../prisma';

type Table = string[][];

function calcularDataUltimaParcela(dataPrimeiraParcela: Date, quantidadeParcelas: number): Date {
    return addMonths(dataPrimeiraParcela, quantidadeParcelas - 1);
}

function addTableWithColors(doc: InstanceType<typeof PDFDocument>, table: Table): void {
    let startX = 50; // Posição X inicial
    let startY = doc.y; // Posição Y inicial
    const fullWidthIndices = [0, 6, 7, 8, 9, 10, 11, 20, 21, 22, 24, 26, 27, 28]; // Índices que ocupam largura total
    const tableWidth = 450; // Largura total da tabela

    const darkGrayIndices = [0, 6, 9, 11, 21, 26];
    const lightGrayIndex = 7;

    const paddingX = 2; // Espaço horizontal interno ajustado
    const paddingY = 2;  // Espaço vertical interno ajustado

    table.forEach((row, rowIndex) => {
        let cellWidths = fullWidthIndices.includes(rowIndex) ? [tableWidth] : [225, 225]; // Largura das células

        // Calcula a altura da linha com base no conteúdo mais alto
        let rowHeight = Math.max(...row.map((cell, cellIndex) => {
            let cellWidth = cellWidths[cellIndex];
            return doc.heightOfString(cell, { width: cellWidth - 2 * paddingX }) + 2 * paddingY; // Ajuste para o padding
        }));

        let cellStartX = startX;

        row.forEach((cell, cellIndex) => {
            let cellWidth = cellWidths[cellIndex];

            // Cor de fundo personalizada
            let fillColor = '#FFFFFF'; // Cor padrão (branca)
            if (darkGrayIndices.includes(rowIndex)) {
                fillColor = '#666666'; // Cinza escuro
            } else if (rowIndex === lightGrayIndex) {
                fillColor = '#CCCCCC'; // Cinza claro
            }

            doc.rect(cellStartX, startY, cellWidth, rowHeight).fill(fillColor);

            // Bordas da célula
            doc.rect(cellStartX, startY, cellWidth, rowHeight).stroke();

            // Texto da célula
            if (darkGrayIndices.includes(rowIndex)) {
                doc.font('Helvetica-Bold'); // Texto em negrito para as linhas especificadas
            } else {
                doc.font('Helvetica'); // Texto normal para as outras linhas
            }

            // Verifica se a célula contém palavras específicas para negrito
            if (cell.includes('COMPRADOR') || cell.includes('GURGEL AZEVEDO E TEÓFILO SERVIÇOS DE ENGENHARIA LTDA')) {
                const parts = cell.split(/(COMPRADOR|GURGEL AZEVEDO E TEÓFILO SERVIÇOS DE ENGENHARIA LTDA)/);

                parts.forEach(part => {
                    if (part === 'COMPRADOR' || part === 'GURGEL AZEVEDO E TEÓFILO SERVIÇOS DE ENGENHARIA LTDA') {
                        doc.font('Helvetica-Bold'); // Negrito para a palavra específica
                        if (part === 'COMPRADOR') {
                            part += ' ';
                        }
                    } else {
                        doc.font('Helvetica'); // Texto normal
                    }

                    doc.fillColor('#000000').fontSize(12).text(part, cellStartX + paddingX, startY + paddingY, {
                        continued: true,
                        width: cellWidth - 2 * paddingX,
                        align: 'left',
                    });
                });

                doc.text('', cellStartX + paddingX, startY + paddingY); // Finaliza a linha
            } else {
                doc.fillColor('#000000').fontSize(12).text(cell, cellStartX + paddingX, startY + paddingY, {
                    width: cellWidth - 2 * paddingX,
                    align: 'justify',
                });
            }

            cellStartX += cellWidth; // Incrementa a posição X para a próxima célula
        });

        startY += rowHeight; // Incrementa a posição Y para a próxima linha
    });
}

export async function generateContractPDF(contractId: string, dataCallback: any, endCallback: any) {
    try {

        const contractExisting = await prismaClient.contract.findFirst({ where: { id: contractId } });

        if (!contractExisting) {
            throw new Error('Contrato não encontrado no Banco de Dados.');
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

        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, left: 60, right: 60, bottom: 50 }
        });

        //Conectando os callbacks aos eventos de fluxo
        doc.on('data', dataCallback);
        doc.on('end', endCallback);

        //Configuração do documento
        doc.font('Helvetica').fontSize(12);

        doc.text('INSTRUMENTO DE COMPRA E VENDA COM ALIENAÇÃO FIDUCIÁRIA', { align: 'center' });
        doc.moveDown();

        doc.text(`Pelo presente instrumento particular de compra e venda com reserva de domínio, a saber de um lado a empresa GURGEL AZEVEDO E TEOFILO SERVIÇOS DE ENGENHARIA LTDA, com sede na cidade de São Miguel - RN, Rua Nikola Tesla, 189, Bairro Maria Manoela, inscrita no CNPJ sob o nº 33.651.184/0001-09, denominada de `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(' VENDEDORA ', { continued: true, align: 'justify' });
        if (enderecoCliente) {
            doc.font('Helvetica').text(` e de outro lado ${contractExisting.nome}, ${contractExisting.profissao.toLocaleLowerCase()}, ${contractExisting.estadoCivil}, ${enderecoCliente.logradouro + ', Nº' + enderecoCliente.numero + ', ' + enderecoCliente.bairro + ', ' + enderecoCliente.cidade + ' - ' + enderecoCliente.uf + ', CEP nº ' + enderecoCliente.cep}, portador (a) do CPF nº ${contractExisting.cpf}, denominado de `, { continued: true, align: 'justify' });
        }
        doc.font('Helvetica-Bold').text(' COMPRADOR', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(', tem entre si, justo e acordado o seguinte:', { align: 'justify' })
        doc.moveDown();

        doc.font('Helvetica-Bold').text('CLÁUSULA 1º - ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` Que o `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(' COMPRADOR ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` adquire nesta Data de ${new Date(contractExisting.dataContrato).toLocaleDateString()}, um sistema fotovoltaico de ${contractExisting.potModulos}kWp de potência com módulos fotovoltaicos ${contractExisting.modeloModulos}, ${contractExisting.potInversor}kW de inversor ${contractExisting.modeloInversor} e estrutura de fixação pela quantia de `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(` R$ ${contractExisting.priceTotal.toFixed(2)} (${extenso(contractExisting.priceTotal, { estilo: 'monetario' }).toUpperCase()}).`, { align: 'justify' });
        doc.moveDown();
        doc.font('Helvetica-Bold').text('CLÁUSULA 2º - ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` Que para pagamento da quantia mencionada, correspondente ao valor do bem adquirido pelo comprador, esse assume o compromisso de efetuar o pagamento de ${contractExisting.quantParcelas} parcelas mensais e consecutivas de `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(` R$ ${contractExisting.priceParcela} (${extenso(contractExisting.priceParcela, { estilo: 'monetario' }).toUpperCase()}) `, { continued: true, align: 'justify' });

        const dataFinal = calcularDataUltimaParcela(new Date(contractExisting.dataPrimeiraParcela), contractExisting.quantParcelas);

        doc.font('Helvetica').text(` a vencer a primeira em ${new Date(contractExisting.dataPrimeiraParcela).toLocaleDateString()} e a última em ${dataFinal.toLocaleDateString()}, representado por boletos bancários que serão enviados pela `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(' VENDEDORA ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` ao `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(' COMPRADOR ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(`, sendo vedado o depósito na conta bancária da `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(' VENDEDORA ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` para quitação de parcelas do presente instrumento particular.`, { align: 'justify' });
        doc.moveDown();

        doc.font('Helvetica-Bold').text('CLÁUSULA 3º - ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` Que para garantia do adimplemento da obrigação ora assumida, o `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(' COMPRADOR ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` na condição de devedor, transfere à `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(' VENDEDORA ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` em alienação fiduciária, o bem objeto da presente transação e descrito na cláusula 1ª, cuja alienação perdurará até a efetiva quitação da última parcela avençada.`, { align: 'justify' });
        doc.moveDown();

        doc.font('Helvetica-Bold').text('CLÁUSULA 4º - ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` Que no caso de inadimplemento o `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(' COMPRADOR ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` ficará sujeito ao pagamento de multa de 2% (dois por cento) ao mês sobre a parcela vencida, além de juros à MORA de 0,33% (zero vírgula trinta e três por cento) sobre o saldo devedor atualizado.`, { align: 'justify' });
        doc.moveDown();

        doc.font('Helvetica-Bold').text('CLÁUSULA 5º - ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` Que nesta DATA ${new Date(contractExisting.dataContrato).toLocaleDateString()} o `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(' COMPRADOR ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` emite em favor da credora uma nota promissória no valor total da dívida, podendo ocorrer o protesto em caso de inadimplemento de três prestações, que serão objeto de protesto ou notificação para constituição em mora do devedor.`, { align: 'justify' });
        doc.moveDown();

        doc.font('Helvetica-Bold').text('CLÁUSULA 6º - ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` Que ocorrendo o inadimplemento, a `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(' VENDEDORA ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` depois de vencidas três parcelas mensais, poderá retomar o bem dado em alienação fiduciária, facultando ao mesmo vender a terceiros o bem objeto do presente.`, { align: 'justify' });
        doc.moveDown();

        doc.font('Helvetica-Bold').text('CLÁUSULA 7º - ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` Que no caso de busca e apreensão a mesma será fulcrada no Dec. Lei n.º 911/69 e em suas disposições, respondendo o `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(' COMPRADOR ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` pelas custas processuais e honorários de advogado, além de multa contratual incidente sobre o saldo devedor.`, { align: 'justify' });
        doc.moveDown();

        doc.font('Helvetica-Bold').text('CLÁUSULA 8º - ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` Que o `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(' COMPRADOR ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` poderá quitar antecipadamente a dívida objeto deste instrumento, com a cotação de juros com base em tabela elaborada pela `, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(' VENDEDORA', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(`, que após o recebimento integral do valor.`, { align: 'justify' });
        doc.moveDown();

        doc.font('Helvetica-Bold').text('CLÁUSULA 9º - ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(` Que as partes elegem o foro da Comarca de São Miguel-RN para dirimirem eventuais dúvidas do presente.`, { align: 'justify' });
        doc.moveDown();

        //Caso possua AVALISTA
        if (avalista && enderecoAvalista) {
            doc.font('Helvetica-Bold').text('CLÁUSULA 10º - ', { continued: true, align: 'justify' });
            doc.font('Helvetica').text(` Que assina como AVALISTA do presente contrato ${avalista.nome}, ${avalista.profissao}, ${enderecoAvalista.logradouro + ', Nº' + enderecoAvalista.numero + ', ' + enderecoAvalista.bairro + ', ' + enderecoAvalista.cidade + ' - ' + enderecoAvalista.uf + ', CEP nº ' + enderecoAvalista.cep}, portador do CPF N° ${avalista.cpf}, que responderá solidariamente pela obrigação constante do presente instrumento.`, { align: 'justify' });
            doc.moveDown();
        }

        doc.text(`E por estarem assim, justos e contratados, assinam o presente em duas (2) vias de igual teor e forma na presença de duas testemunhas, para que surta seus efeitos de direito.`, { align: 'justify' });
        doc.moveDown();

        doc.text(`Atenciosamente,`, { align: 'justify' });
        doc.moveDown();
        doc.moveDown();
        doc.moveDown();

        doc.text(`São Miguel - RN, ${new Date(contractExisting.dataContrato).toLocaleDateString()} `, { align: 'justify' });
        doc.moveDown();
        doc.moveDown();
        doc.moveDown();

        doc.text(`_____________________________________________`, { align: 'center' });
        doc.moveDown();
        doc.text(`${contractExisting.nome.toUpperCase()}`, { align: 'center' });
        doc.moveDown();
        doc.text(`COMPRADOR`, { align: 'center' });
        doc.moveDown();
        doc.text(`CPF: ${contractExisting.cpf}`, { align: 'center' });
        doc.moveDown();

        doc.moveDown();
        doc.moveDown();
        doc.moveDown();

        //caso tenha AVALISTA
        if (avalista) {
            doc.text(`_____________________________________________`, { align: 'center' });
            doc.moveDown();
            doc.text(`${avalista.nome.toUpperCase()}`, { align: 'center' });
            doc.moveDown();
            doc.text(`AVALISTA`, { align: 'center' });
            doc.moveDown();
            doc.text(`CPF: ${avalista.cpf}`, { align: 'center' });
            doc.moveDown();

            doc.moveDown();
            doc.moveDown();
            doc.moveDown();
        }

        doc.text(`_____________________________________________`, { align: 'center' });
        doc.moveDown();
        doc.text(`GURGEL AZEVEDO E TEOFILO SERVIÇOS DE ENGENHARIA LTDA`, { align: 'center' });
        doc.moveDown();
        doc.text(`VENDEDORA`, { align: 'center' });
        doc.moveDown();
        doc.text(`CNPJ: 33.651.184/0001-09`, { align: 'center' });
        doc.moveDown();

        doc.addPage();

        doc.text('DECLARAÇÕES', { align: 'center' });
        doc.moveDown();

        // Tabelas e Declarações
        if (enderecoCliente) {
            addTableWithColors(doc, [
                ['1. COMPRADOR'],
                [`Devedor: ${contractExisting.nome.toUpperCase()}`, `CPF: ${contractExisting.cpf}`],
                [`Data de Nascimento: ${new Date(contractExisting.dataNascimento).toLocaleDateString()}`, `E-mail: ${contractExisting.email}`],
                [`Logradouro: ${enderecoCliente.logradouro}`, `Número: ${enderecoCliente.numero}`],
                [`Bairro: ${enderecoCliente.bairro}`, `Cidade: ${enderecoCliente.cidade}`],
                [`UF: ${enderecoCliente.uf}`, `CEP: ${enderecoCliente.cep}`],
                ['2. GARANTIAS'],
                ['2.1 ALIENAÇÃO FIDUCIÁRIA DE BENS MÓVEIS'],
                ['Alienação fiduciária sobre bens de propriedade do COMPRADOR ou do DEVEDOR SOLIDÁRIO COOBRIGADO, a qual será formalizada em instrumento se parado na forma do artigo 32 da Lei n°10.931/04 conforme descrito no quadro 6'],
                ['3. VENDEDORA'],
                ['GURGEL AZEVEDO E TEÓFILO SERVIÇOS DE ENGENHARIA LTDA, empresa de direito privado, inscrita no CNPJ sob o n°33.651.184/0001-09 e com Sede na Rua Nikola Tesla, 189, Maria Manoela, São Miguel -RN, 59.920-000'],
                ['4. CARACTERÍSTICAS DA VENDA E CONDIÇÕES DE PAGAMENTO'],
                [`4.1. Valor da venda: ${contractExisting.priceTotal.toFixed(2)}`, `4.2. Valor do IOF: R$0,00`],
                ['4.3. Valor da TC: R$ 0,00', `4.4. Valor total da venda: R$ ${contractExisting.priceTotal.toFixed(2)}`],
                [`4.5. Data da emissão e desembolso: ${new Date(contractExisting.dataContrato).toLocaleDateString()}`, '4.6. Praça de Pagamento: São Miguel-RN'],
                [`4.7. Quantidade de parcelas: ${contractExisting.quantParcelas}`, `4.8. Valor da Parcela: R$ ${contractExisting.priceParcela.toFixed(2)}`],
                [`4.9. Período de carência: ${contractExisting.carencia} dias`, `4.10. Vencimento da primeira parcela: ${new Date(contractExisting.dataPrimeiraParcela).toLocaleDateString()}`],
                [`4.11. Vencimento das Parcelas: Dia ${new Date(contractExisting.dataPrimeiraParcela).getDate()}`, `4.12. Vencimento da última parcela: ${dataFinal.toLocaleDateString()}`],
                ['4.13. Taxa pré-fixada de juros a.m. (%): 1,69', '4.14. Taxa pré-fixada de juros a.a.(%): 20,28'],
                ['4.15. Forma de Pagamento das Parcelas: Boleto', ''],
                ['4.16. Atualização Monetária: As parcelas do empréstimo não serão objetos de atualização monetária.'],
                ['5. DADOS BANCÁRIOS PARA DEPÓSITO DOS RECURSOS'],
                ['N° do banco:748 Banco Cooperativo Sicredi S.A-Bansicredi'],
                ['Agência:2207', 'Conta: 21619-4'],
                ['Razão Social: Gurgel Azevedo E Teófilo Serviços de engenharia LTDA'],
                ['CNPJ:33.651.184/0001-09', ''],
                ['6.DADOS DO SISTEMA FOTOVOLTAICO'],
                [`Descrição do sistema: ${contractExisting.potModulos}kWp de potência com módulos fotovoltaicos ${contractExisting.modeloModulos}, ${contractExisting.potInversor}kW de inversor(es) ${contractExisting.modeloInversor} e estruturas de fixação.`],
                [`Local da instalação: ${enderecoCliente.logradouro + ', Nº' + enderecoCliente.numero + ', ' + enderecoCliente.bairro + ', ' + enderecoCliente.cidade + ' - ' + enderecoCliente.uf + ', CEP nº ' + enderecoCliente.cep}`]
            ]);
        }

        doc.addPage();

        doc.font('Helvetica').text(`Eu, ${contractExisting.nome}, Portador do RG n° ${contractExisting.rg} e inscrito no CPF n° ${contractExisting.cpf}`, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(' ("COMPRADOR") ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(`do sistema de energia solar fotovoltaica de ${contractExisting.potModulos}kWp de Potência, de contrato emitido ${new Date(contractExisting.dataContrato).toLocaleDateString()} no valor de R$ ${contractExisting.priceTotal.toFixed(2)}, da empresa Gurgel Azevedo e Teófilo Serviços de Engenharia LTDA, inscrita no CNPJ 33.651.184/0001-09, vem pelo presente documento declarar que:`, { align: 'justify' });
        doc.moveDown();

        const clauseStartX = 50;
        const clauseIndent = 55; // Espaço entre o número e o texto

        // Adiciona o texto das cláusulas com recuo
        const clauses = [
            "(I)     declara que o imóvel no qual será instalado o sistema fotovoltaico adquirido com os recursos da vendedora é de propriedade do comprador ou de seus familiares, sendo que o comprador detém o direito de uso e/ou posse do referido imóvel;",
            "(II)    confirmo e ratifico que autorizo a instalação e manutenção, por prazo indeterminado, de dispositivo eletrônico de propriedade da vendedora, juntamente ao sistema de energia solar fotovoltaica (“Equipamento”), o qual poderá ser utilizado para captação dos dados de funcionamento do Equipamento e de consumo de energia do COMPRADOR, e desligamento remoto do Equipamento, entre outros;",
            "(III)   concordo e autorizo, de forma livre, expressa, informada e inequívoca, conforme inciso I do art. 7º da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais), observados também os incisos II, V, VI e IX do art. 7º da Lei nº 13.709/2018, que a VENDEDORA, por intermédio do Dispositivo, realize todo e qualquer Tratamento dos dados pessoais do COMPRADOR que tenham sido fornecidos à e/ou obtidos pela VENDEDORA (incluindo, entre outros, os dados de funcionamento e geração de energia pelo Equipamento e de consumo de energia do COMPRADOR), bem como daqueles necessários para a execução dos instrumentos contratuais celebrados entre as Partes. Para fins desta cláusula o termo definido “Tratamento” significa, de maneira direta ou indireta, coletar, obter, produzir, compilar, classificar, utilizar, acessar, reproduzir, transmitir, distribuir, processar, arquivar, armazenar, tratar, avaliar, controlar, eliminar, modificar, comunicar, transferir, difundir e/ou extrair os dados pessoais do COMPRADOR.",
            "(IV)    Declara ainda que em caso de inadimplência, a VENDEDORA poderá desligar o equipamento remotamente. No caso de uma maior inadimplência recolher o bem descrito e financiado nesse contrato em qualquer momento."
        ];

        let yPosition = doc.y;

        clauses.forEach(clause => {
            // Adiciona o recuo para o texto
            const parts = clause.split(/(COMPRADOR|VENDEDORA)/);
            yPosition = doc.y; // Atualiza a posição Y após adicionar o texto
            doc.text(parts[0], clauseStartX + clauseIndent, yPosition, {
                width: 500 - clauseIndent, // Ajuste conforme a largura desejada
                align: 'justify',
                continued: true
            });

            for (let i = 1; i < parts.length; i++) {
                if (parts[i] === 'COMPRADOR' || parts[i] === 'VENDEDORA') {
                    doc.font('Helvetica-Bold').text(parts[i] + ' ', { continued: true });
                } else {
                    doc.font('Helvetica').text(parts[i], { continued: true });
                }
            }

            doc.text('', clauseStartX + clauseIndent, doc.y); // Finaliza a linha

            yPosition = doc.y + 5; // Adiciona um espaço extra entre as cláusulas
            doc.moveDown(2);
        });

        doc.addPage();

        doc.font('Helvetica').text(`O`, { continued: true, align: 'justify' });
        doc.font('Helvetica-Bold').text(' COMPRADOR ', { continued: true, align: 'justify' });
        doc.font('Helvetica').text(`firma o presente Termo e se obriga, em caráter irrevogável e irretratável, por si e por seus eventuais sucessores, às declarações e condições aqui previstas.`, { align: 'justify' });
        doc.moveDown();

        doc.text('Atenciosamente, ', { align: 'justify' });
        doc.moveDown();

        doc.text(`São Miguel - RN ${new Date(contractExisting.dataContrato).toLocaleDateString()}:`, { align: 'justify' });
        doc.moveDown();
        doc.moveDown();
        doc.moveDown();

        doc.text(`_____________________________________________`, { align: 'center' });
        doc.moveDown();
        doc.text(`${contractExisting.nome.toUpperCase()}`, { align: 'center' });
        doc.moveDown();
        doc.text(`COMPRADOR`, { align: 'center' });
        doc.moveDown();
        doc.text(`CPF: ${contractExisting.cpf}`, { align: 'center' });
        doc.moveDown();

        doc.moveDown();
        doc.moveDown();
        doc.moveDown();

        //caso tenha AVALISTA
        if (avalista) {
            doc.text(`_____________________________________________`, { align: 'center' });
            doc.moveDown();
            doc.text(`${avalista.nome.toUpperCase()}`, { align: 'center' });
            doc.moveDown();
            doc.text(`AVALISTA`, { align: 'center' });
            doc.moveDown();
            doc.text(`CPF: ${avalista.cpf}`, { align: 'center' });
            doc.moveDown();

            doc.moveDown();
            doc.moveDown();
            doc.moveDown();
        }

        doc.text(`_____________________________________________`, { align: 'center' });
        doc.moveDown();
        doc.text(`GURGEL AZEVEDO E TEOFILO SERVIÇOS DE ENGENHARIA LTDA`, { align: 'center' });
        doc.moveDown();
        doc.text(`VENDEDORA`, { align: 'center' });
        doc.moveDown();
        doc.text(`CNPJ: 33.651.184 /0001 -09`, { align: 'center' });
        doc.moveDown();

        doc.moveDown(2); // Espaço antes da seção de testemunhas

        // Título da seção
        doc.fontSize(12).text('Testemunhas:');
        doc.moveDown(4);

        // Definições de posição
        const x1 = 50;   // Posição X para a primeira coluna
        const x2 = 250;  // Posição X para a segunda coluna

        // Primeira linha de testemunhas
        doc.fontSize(10)
            .text('1. __________________________', x1, doc.y, { continued: true })
            .text('2. __________________________', x2 - 100, doc.y);

        doc.moveDown(1); // Espaço entre linhas

        // Segunda linha: Nome
        doc.text('Nome:', x1, doc.y, { continued: true })
            .text('Nome:', x2 + 30, doc.y);

        // Terceira linha: RG
        doc.text('RG:', x1, doc.y, { continued: true })
            .text('RG:', x2 + 41, doc.y);

        // Quarta linha: CPF/ME
        doc.text('CPF/ME:', x1, doc.y, { continued: true })
            .text('CPF/ME:', x2 + 18, doc.y);

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