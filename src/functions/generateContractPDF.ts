import { addMonths } from 'date-fns';
import prismaClient from '../prisma';
import { formatCEP, formatCPF, formatRG } from '../utils/formarString';
import { generatePdf } from 'html-pdf-node';
import { UserRole } from '@prisma/client';
import { formatGenderStringEstadoCivil } from './formatGenderProfission';

const extenso = require('numero-por-extenso');

function calcularDataUltimaParcela(dataPrimeiraParcela: Date, quantidadeParcelas: number): Date {
    return addMonths(dataPrimeiraParcela, quantidadeParcelas - 1);
}

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
});

export async function generateContractPDF(contractId: string, userId: string, callback: (err: Error | null, buffer: Buffer | null) => void) {
    try {

        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const contractExisting = await prismaClient.contract.findFirst({ where: { id: contractId } });

        if (!contractExisting) {
            throw new Error('Contrato não encontrado no Banco de Dados.');
        }

        if (existingUser.id !== contractExisting.userId && existingUser.role !== UserRole.ADMIN) {
            throw new Error('Você não tem permissão para acessar esse contrato.');
        }

        const enderecoCliente = await prismaClient.endereco.findFirst({ where: { id: contractExisting.enderecoId } });

        if (!enderecoCliente) {
            throw new Error('Endereço não encontrado no banco de dados.');
        }

        let avalista = null;
        let enderecoAvalista = null;

        if (contractExisting.avalistaId) {
            avalista = await prismaClient.avalista.findFirst({ where: { id: contractExisting.avalistaId } });
            if (avalista) {
                enderecoAvalista = await prismaClient.endereco.findFirst({ where: { id: avalista.enderecoId } });
            }
        }

        const valorTotal = formatadorMoeda.format(contractExisting.priceTotal);
        const valorParcela = formatadorMoeda.format(contractExisting.priceParcela);

        const dataContrato = new Date(contractExisting.dataContrato).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const dataPrimeiraParcela = new Date(contractExisting.dataPrimeiraParcela).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const dataFinal = calcularDataUltimaParcela(new Date(contractExisting.dataPrimeiraParcela), contractExisting.quantParcelas);

        const dataUltimaParcela = new Date(dataFinal).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const dataNascimento = new Date(contractExisting.dataNascimento).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const htmlContent = `
            <html>
                <head>
                    <style>
                        body {
                            font-family: 'Helvetica', sans-serif;
                            font-size: 16px;
                            line-height: 1.5;
                            margin: 0;
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

                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 20px;
                        }

                        td {
                            border: 1px solid #000;
                            text-align: justify;
                            font-size: 16px;
                            line-height: 1;
                            padding: 2;
                        }

                        td > p {
                            display: flex;
                            align-items: flex-start;
                            justify-content: flex-start;
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

                        .contract-recuo {
                            margin-left: 100px;
                            line-height: 1;
                        }

                        .contract-recuo-content {
                            display: grid;
                            grid-template-columns: 0.1fr 0.9fr;

                        }

                        .contract-recuo-content > p{
                            text-align: justify;
                        }

                        .signature > p {
                            margin: 0;
                        }

                        .page {
                            page-break-before: always;
                        }

                        .dark-gray {
                            background-color: #666666;
                            font-weight: bold;
                        }

                        .light-gray {
                            background-color: #CCCCCC;
                        }

                        .full-width {
                            width: 100%;
                        }

                        .half-width {
                            width: 50%;
                        }

                        .bold {
                            font-weight: bold;
                        }

                        .testemunhas {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            margin-top: 150px;
                        }

                        .testemunhas > div {
                            display: flex;
                            flex-direction: column;
                            line-height: 1;
                        }

                        .testemunhas > div > p {
                            display: flex;
                            align-items: center;
                            margin: 0;
                        }

                        .underline {
                            display: inline-block;
                            width: 80%;
                            border-bottom: 1px solid black;
                            margin-left: 5px;
                        }

                        .div-title {
                            margin-top: 50px
                        }
                        
                    </style>
                </head>
                <body>
                    <div class="page">
                        <div>
                            <h1>INSTRUMENTO DE COMPRA E VENDA COM ALIENAÇÃO FIDUCIÁRIA</h1>
                        </div>
                        <div class="contract-container">
                            <p>Pelo presente instrumento particular de compra e venda com reserva de domínio, a saber de um lado a empresa GURGEL AZEVEDO E TEOFILO SERVIÇOS DE ENGENHARIA LTDA, com sede na cidade de São Miguel - RN, Rua Nikola Tesla, 189, Bairro Maria Manoela, inscrita no CNPJ sob o nº 33.651.184/0001-09, denominada de <strong>VENDEDORA</strong> e de outro lado ${contractExisting.nome.toUpperCase()}, ${contractExisting.profissao.toUpperCase()}, ${formatGenderStringEstadoCivil(contractExisting.genero, contractExisting.estadoCivil)}, residente no endereço ${enderecoCliente.logradouro.toUpperCase() + ', Nº ' + enderecoCliente.numero + ', ' + enderecoCliente.bairro.toUpperCase() + ', ' + enderecoCliente.cidade.toUpperCase() + ' - ' + enderecoCliente.uf.toUpperCase() + ', CEP nº ' + formatCEP(enderecoCliente.cep)}, portador (a) do CPF nº ${formatCPF(contractExisting.cpf)}, denominado de <strong>${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}</strong>, tem entre si, justo e acordado o seguinte:</p>
                            <p><strong>CLÁUSULA 1º -</strong> Que ${contractExisting.genero === 'MASCULINO' ? 'o' : 'a'} <strong>${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}</strong> adquire nesta Data de ${dataContrato}, um sistema fotovoltaico de ${contractExisting.potModulos}kWp de potência com módulos fotovoltaicos ${contractExisting.modeloModulos}, ${contractExisting.potInversor}kW de inversor ${contractExisting.modeloInversor} e estrutura de fixação pela quantia de <strong>${valorTotal} (${extenso.porExtenso(contractExisting.priceTotal, extenso.estilo.monetario).toUpperCase()})</strong>.</p>
                            <p><strong>CLÁUSULA 2º -</strong> Que para pagamento da quantia mencionada, correspondente ao valor do bem adquirido pelo comprador, esse assume o compromisso de efetuar o pagamento de ${contractExisting.quantParcelas} parcelas mensais e consecutivas de <strong>${valorParcela} (${extenso.porExtenso(contractExisting.priceParcela, extenso.estilo.monetario).toUpperCase()})</strong> a vencer a primeira em ${dataPrimeiraParcela} e a última em ${dataUltimaParcela}, representado por boletos bancários que serão enviados pela <strong>VENDEDORA</strong> ${contractExisting.genero === 'MASCULINO' ? 'ao' : 'à'} <strong>${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}</strong>, sendo vedado o depósito na conta bancária da <strong>VENDEDORA</strong> para quitação de parcelas do presente instrumento particular.</p>
                            <p><strong>CLÁUSULA 3º -</strong> Que para garantia do adimplemento da obrigação ora assumida, ${contractExisting.genero === 'MASCULINO' ? 'o' : 'a'} <strong>${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}</strong> na condição de ${contractExisting.genero === 'MASCULINO' ? 'devedor' : 'devedora'}, transfere à <strong>VENDEDORA</strong> em alienação fiduciária, o bem objeto da presente transação e descrito na cláusula 1ª, cuja alienação perdurará até a efetiva quitação da última parcela avençada.</p>
                            <p><strong>CLÁUSULA 4º -</strong> Que no caso de inadimplemento ${contractExisting.genero === 'MASCULINO' ? 'o' : 'a'} <strong>${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}</strong> ficará ${contractExisting.genero === 'MASCULINO' ? 'sujeito' : 'sujeita'} ao pagamento de multa de 2% (dois por cento) ao mês sobre a parcela vencida, além de juros à MORA de 0,33% (zero vírgula trinta e três por cento) sobre o saldo devedor atualizado.</p>
                            <p><strong>CLÁUSULA 5º -</strong> Que nesta DATA ${dataContrato} ${contractExisting.genero === 'MASCULINO' ? 'o' : 'a'} <strong>${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}</strong> emite em favor da credora uma nota promissória no valor total da dívida, podendo ocorrer o protesto em caso de inadimplemento de três prestações, que serão objeto de protesto ou notificação para constituição em mora ${contractExisting.genero === 'MASCULINO' ? 'do devedor' : 'da devedora'}.</p>
                            <p><strong>CLÁUSULA 6º -</strong> Que ocorrendo o inadimplemento, a <strong>VENDEDORA</strong> depois de vencidas três parcelas mensais, poderá retomar o bem dado em alienação fiduciária, facultando ao mesmo vender a terceiros o bem objeto do presente.</p>
                            <p><strong>CLÁUSULA 7º -</strong> Que no caso de busca e apreensão a mesma será fulcrada no Dec. Lei n.º 911/69 e em suas disposições, respondendo ${contractExisting.genero === 'MASCULINO' ? 'o' : 'a'} <strong>${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}</strong> pelas custas processuais e honorários de advogado, além de multa contratual incidente sobre o saldo devedor.</p>
                            <p><strong>CLÁUSULA 8º -</strong> Que ${contractExisting.genero === 'MASCULINO' ? 'o' : 'a'} <strong>${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}</strong> poderá quitar antecipadamente a dívida objeto deste instrumento, com a cotação de juros com base em tabela elaborada pela <strong>VENDEDORA</strong>, que após o recebimento integral do valor.</p>
                            <p><strong>CLÁUSULA 9º -</strong> Que as partes elegem o foro da Comarca de São Miguel-RN para dirimirem eventuais dúvidas do presente.</p>
                            ${avalista && enderecoAvalista ?
                `<p><strong>CLÁUSULA 10º -</strong> Que assina como AVALISTA do presente contrato ${avalista.nome.toUpperCase()}, ${avalista.profissao.toUpperCase()}, residente no endereço ${enderecoAvalista.logradouro.toUpperCase() + ', Nº' + enderecoAvalista.numero + ', ' + enderecoAvalista.bairro.toUpperCase() + ', ' + enderecoAvalista.cidade.toUpperCase() + ' - ' + enderecoAvalista.uf.toUpperCase() + ', CEP nº ' + formatCEP(enderecoAvalista.cep)}, portador(a) do CPF N° ${formatCPF(avalista.cpf)}, que responderá solidariamente pela obrigação constante do presente instrumento.</p>`
                :
                ''
            }
                            <p>E por estarem assim, justos e contratados, assinam o presente em duas (2) vias de igual teor e forma na presença de duas testemunhas, para que surta seus efeitos de direito.</p>
                            <p>Atenciosamente,</p>
                        <div>
                        <div class="contract-details">
                            <p>São Miguel - RN, ${dataContrato}</p>
                        </div>
                        <br/>
                        <div class="signature">
                            <hr />
                            <p>${contractExisting.nome.toUpperCase()}</p>
                            <p>${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}</p>
                            <p>CPF: ${formatCPF(contractExisting.cpf)}</p>
                        </div>
                        ${avalista && enderecoAvalista ?
                `<div class="signature">
                                    <hr />
                                    <p>${avalista.nome.toUpperCase()}</p>
                                    <p>AVALISTA</p>
                                    <p>CPF: ${formatCEP(avalista.cpf)}</p>
                                </div>`
                :
                ''
            }
                        <div class="signature">
                            <hr />
                            <p>GURGEL AZEVEDO E TEOFILO SERVIÇOS DE ENGENHARIA LTDA</p>
                            <p>VENDEDORA</p>
                            <p>CNPJ: 33.651.184/0001-09</p>
                        </div>
                    </div>
                    <div class="page">
                        <div>
                            <h1>DECLARAÇÕES</h1>
                        </div>
                        <div>
                            <table>
                                <tr>
                                    <td colspan="2" class="dark-gray">1. COMPRADOR</td>
                                </tr>
                                <tr>
                                    <td class="half-width">Devedor: ${contractExisting.nome.toUpperCase()}</td>
                                    <td class="half-width">CPF: ${formatCPF(contractExisting.cpf)}</td>
                                </tr>
                                <tr>
                                    <td class="half-width">Data de Nascimento: ${dataNascimento}</td>
                                    <td class="half-width">E-mail: ${contractExisting.email}</td>
                                </tr>
                                <tr>
                                    <td class="half-width">Logradouro: ${enderecoCliente.logradouro.toUpperCase()}</td>
                                    <td class="half-width">Número: ${enderecoCliente.numero}</td>
                                </tr>
                                <tr>
                                    <td class="half-width">Bairro: ${enderecoCliente.bairro.toUpperCase()}</td>
                                    <td class="half-width">Cidade: ${enderecoCliente.cidade.toUpperCase()}</td>
                                </tr>
                                <tr>
                                    <td class="half-width">UF: ${enderecoCliente.uf.toUpperCase()}</td>
                                    <td class="half-width">CEP: ${formatCEP(enderecoCliente.cep)}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" class="dark-gray">2. GARANTIAS</td>
                                </tr>
                                <tr class="light-gray">
                                    <td colspan="2">2.1 ALIENAÇÃO FIDUCIÁRIA DE BENS MÓVEIS</td>
                                </tr>
                                <tr>
                                    <td colspan="2">
                                        Alienação fiduciária sobre bens de propriedade ${contractExisting.genero === 'MASCULINO' ? 'do' : 'da'} <span class="bold">${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}</span> ou do(a) <span class="bold">DEVEDOR(A) SOLIDÁRIO(A) COOBRIGADO</span>, a qual será formalizada em instrumento separado na forma do artigo 32 da Lei n°10.931/04 conforme descrito no quadro 6.
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2" class="dark-gray">3. VENDEDORA</td>
                                </tr>
                                <tr>
                                    <td colspan="2">GURGEL AZEVEDO E TEÓFILO SERVIÇOS DE ENGENHARIA LTDA, empresa de direito privado, inscrita no CNPJ sob o n°33.651.184/0001-09 e com Sede na Rua Nikola Tesla, 189, Maria Manoela, São Miguel -RN, 59.920-000</td>
                                </tr>
                                <tr>
                                    <td colspan="2" class="dark-gray">4. CARACTERÍSTICAS DA VENDA E CONDIÇÕES DE PAGAMENTO</td>
                                </tr>
                                <tr>
                                    <td class="half-width">4.1. Valor da venda: ${valorTotal}</td>
                                    <td class="half-width">4.2. Valor do IOF: R$0,00</td>
                                </tr>
                                <tr>
                                    <td class="half-width">4.3. Valor da TC: R$ 0,00</td>
                                    <td class="half-width">4.4. Valor total da venda: ${valorTotal}</td>
                                </tr>
                                <tr>
                                    <td class="half-width">4.5. Data da emissão e desembolso: ${new Date(contractExisting.dataContrato).toLocaleDateString()}</td>
                                    <td class="half-width">4.6. Praça de Pagamento: São Miguel-RN</td>
                                </tr>
                                <tr>
                                    <td class="half-width">4.7 Quantidade de parcelas: ${contractExisting.quantParcelas}</td>
                                    <td class="half-width">4.8 Valor da Parcela: ${valorParcela}</td>
                                </tr>
                                <tr>
                                    <td class="half-width">4.9 Período de carência: ${contractExisting.carencia} dias</td>
                                    <td class="half-width">4.10 Vencimento da primeira parcela: ${dataPrimeiraParcela}</td>
                                </tr>
                                <tr>
                                    <td class="half-width">4.11. Vencimento das Parcelas: Dia ${new Date(contractExisting.dataPrimeiraParcela).getDate()}</td>
                                    <td class="half-width">4.12. Vencimento da última parcela: ${dataUltimaParcela}</td>
                                </tr>
                                <tr>
                                    <td class="half-width">4.13. Taxa pré-fixada de juros a.m. (%): 1,69</td>
                                    <td class="half-width">4.14. Taxa pré-fixada de juros a.a.(%): 20,28</td>
                                </tr>
                                <tr>
                                    <td class="half-width">4.15. Forma de Pagamento das Parcelas: Boleto</td>
                                    <td class="half-width"></td>
                                </tr>
                                <tr>
                                    <td colspan="2">4.16. Atualização Monetária: As parcelas do empréstimo não serão objetos de atualização monetária.</td>
                                </tr>
                                <tr>
                                    <td colspan="2" class="dark-gray">5. DADOS BANCÁRIOS PARA DEPÓSITO DOS RECURSOS</td>
                                </tr>
                                <tr>
                                    <td colspan="2">N° do banco: 748 Banco Cooperativo Sicredi S.A-Bansicredi</td>
                                </tr>
                                <tr>
                                    <td class="half-width">Agência: 2207</td>
                                    <td class="half-width">Conta: 21619-4</td>
                                </tr>
                                <tr>
                                    <td colspan="2">Razão Social: Gurgel Azevedo E Teófilo Serviços de engenharia LTDA</td>
                                </tr>
                                <tr>
                                    <td class="half-width">CNPJ:33.651.184/0001-09</td>
                                    <td class="half-width"></td>
                                </tr>
                                <tr>
                                    <td colspan="2" class="dark-gray">6.DADOS DO SISTEMA FOTOVOLTAICO</td>
                                </tr>
                                <tr>
                                    <td colspan="2">Descrição do sistema: ${contractExisting.potModulos}kWp de potência com módulos fotovoltaicos ${contractExisting.modeloModulos}, ${contractExisting.potInversor}kW de inversor(es) ${contractExisting.modeloInversor} e estruturas de fixação.</td>
                                </tr>
                                <tr>
                                    <td colspan="2">Local da instalação: ${enderecoCliente.logradouro.toUpperCase() + ', Nº' + enderecoCliente.numero + ', ' + enderecoCliente.bairro.toUpperCase() + ', ' + enderecoCliente.cidade.toUpperCase() + ' - ' + enderecoCliente.uf.toUpperCase() + ', CEP nº ' + formatCEP(enderecoCliente.cep)}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    <div class="page">
                        <div class="contract-container">
                            <p>Eu, ${contractExisting.nome.toUpperCase()}, ${contractExisting.genero === 'MASCULINO' ? 'Portador' : 'portadora'} do RG n° ${formatRG(contractExisting.rg)} e ${contractExisting.genero === 'MASCULINO' ? 'inscrito' : 'inscrita'} no CPF n° ${formatCPF(contractExisting.cpf)}<strong>("${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}")</strong>, do sistema de energia solar fotovoltaica de ${contractExisting.potModulos}kWp de Potência, de contrato emitido ${dataContrato} no valor de ${valorTotal}, da empresa Gurgel Azevedo e Teófilo Serviços de Engenharia LTDA, inscrita no CNPJ 33.651.184/0001-09, vem pelo presente documento declarar que:</p>
                        </div>
                        <div class="contract-recuo">
                            <div class="contract-recuo-content">
                                <p>(i)</p>
                                <p>Declara que o imóvel no qual será instalado o sistema fotovoltaico adquirido com os recursos da vendedora é de propriedade do ${contractExisting.genero === 'MASCULINO' ? 'comprador' : 'compradora'} ou de seus familiares, sendo que ${contractExisting.genero === 'MASCULINO' ? 'o' : 'a'} ${contractExisting.genero === 'MASCULINO' ? 'comprador' : 'compradora'} detém o direito de uso e/ou posse do referido imóvel;</p>
                            </div>
                            <div class="contract-recuo-content">
                                <p>(ii)</p>
                                <p>Confirmo e ratifico que autorizo a instalação e manutenção, por prazo indeterminado, de dispositivo eletrônico de propriedade da vendedora, juntamente ao sistema de energia solar fotovoltaica (“Equipamento”), o qual poderá ser utilizado para captação dos dados de funcionamento do Equipamento e de consumo de energia ${contractExisting.genero === 'MASCULINO' ? 'do' : 'da'}do <strong>${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}</strong>, e desligamento remoto do Equipamento, entre outros;  </p>
                            </div>
                            <div class="contract-recuo-content">
                                <p>(iii)</p>
                                <p>Concordo e autorizo, de forma livre, expressa, informada e inequívoca, conforme inciso I do art. 7º da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais), observados também os incisos II, V, VI e IX do art. 7º da Lei nº 13.709/2018, que a <strong>VENDEDORA</strong>, por intermédio do Dispositivo, realize todo e qualquer Tratamento dos dados pessoais ${contractExisting.genero === 'MASCULINO' ? 'do' : 'da'} <strong>${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}</strong> que tenham sido fornecidos à e/ou obtidos pela <strong>VENDEDORA</strong> (incluindo, entre outros, os dados de funcionamento e geração de energia pelo Equipamento e de consumo de energia ${contractExisting.genero === 'MASCULINO' ? 'do' : 'da'} <strong>${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}</strong>), bem como daqueles necessários para a execução dos instrumentos contratuais celebrados entre as Partes. Para fins desta cláusula o termo definido “Tratamento” significa, de maneira direta ou indireta, coletar, obter, produzir, compilar, classificar, utilizar, acessar, reproduzir, transmitir, distribuir, processar, arquivar, armazenar, tratar, avaliar, controlar, eliminar, modificar, comunicar, transferir, difundir e/ou extrair os dados pessoais ${contractExisting.genero === 'MASCULINO' ? 'do' : 'da'} <strong>${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}</strong>;</p>
                            </div>
                            <div class="contract-recuo-content">
                                <p>(iv)</p>
                                <p>Declara ainda que em caso de inadimplência, a <strong>VENDEDORA</strong> poderá desligar o equipamento remotamente. No caso de uma maior inadimplência recolher o bem descrito e financiado nesse contrato em qualquer momento.</p>
                            </div>
                        </div>
                    </div>
                    <div class="page">
                        <div class="contract-container">
                            <p>${contractExisting.genero === 'MASCULINO' ? 'O' : 'A'} <strong>${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}</strong> firma o presente Termo e se obriga, em caráter irrevogável e irretratável, por si e por seus eventuais sucessores, às declarações e condições aqui previstas.</p>
                            <p>Atenciosamente,</p>
                        <div>
                        <div class="contract-details">
                            <p>São Miguel - RN, ${dataContrato}</p>
                        </div>
                        <br/>
                        <div class="signature">
                            <hr />
                            <p>${contractExisting.nome.toUpperCase()}</p>
                            <p>${contractExisting.genero === 'MASCULINO' ? 'COMPRADOR' : 'COMPRADORA'}</p>
                            <p>CPF: ${formatCPF(contractExisting.cpf)}</p>
                        </div>
                        ${avalista && enderecoAvalista ?
                `<div class="signature">
                                    <hr />
                                    <p>${avalista.nome.toUpperCase()}</p>
                                    <p>AVALISTA</p>
                                    <p>CPF: ${formatCEP(avalista.cpf)}</p>
                                </div>`
                :
                ''
            }
                        <div class="signature">
                            <hr />
                            <p>GURGEL AZEVEDO E TEOFILO SERVIÇOS DE ENGENHARIA LTDA</p>
                            <p>VENDEDORA</p>
                            <p>CNPJ: 33.651.184/0001-09</p>
                        </div>
                        <div class="div-title">
                            <p>Testemunhas: </p>
                        </div>
                        <div class="testemunhas">
                            <div>
                                <p><strong>1.</strong><span class="underline"></span></p>
                                <p>Nome:</p>
                                <p>RG:</p>
                                <p>CPF/ME:</p>
                            </div>
                            <div>
                                <p><strong>2.</strong><span class="underline"></span></p>
                                <p>Nome:</p>
                                <p>RG:</p>
                                <p>CPF/ME:</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;

        const options = {
            format: 'A4',
            margin: {
                top: '75px',    // Margem superior
                bottom: '75px', // Margem inferior
                left: '75px',   // Margem esquerda
                right: '75px'   // Margem direita
            },
            printBackground: true
        };
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