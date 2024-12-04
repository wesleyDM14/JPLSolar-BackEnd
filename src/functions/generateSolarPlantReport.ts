import prismaClient from "../prisma";
import { generatePdf } from "html-pdf-node";
import { getChartByType } from "./getGrowattParams";
import growatt from "growatt";
import { Inversor } from "@prisma/client";
import { generateChart } from "./generateChart";
import { formatPhone } from "../utils/formarString";
import { fetchAbbData, getChartAbbByType } from "./getAbbParams";
import { fetchDeyeData, getChartDeyeByType } from "./getDeyeParams";
import { fetchCanadianData, getChartCanadianByType } from "./getCanadianParams";

const growattApi = new growatt({});
const growattApiC = new growatt({ indexCandI: true });

async function tryLoginAndFetchData(api: growatt, login: string, password: string): Promise<any> {
    const { result } = await api.login(login, password);
    if (result !== 1) throw new Error('Erro no login');
    const options = { plantData: false, weather: false, totalData: false, statusData: false, historyLast: false };
    const plantData = await api.getAllPlantData(options);
    await api.logout();
    return plantData;
}

async function fetchPlantData(login: string, password: string): Promise<any> {
    try {
        let plantData = await tryLoginAndFetchData(growattApi, login, password);

        if (Object.keys(plantData).length === 0) {
            plantData = await tryLoginAndFetchData(growattApiC, login, password);
        }

        return plantData;
    } catch (error: any) {
        throw new Error(`Erro ao buscar dados da planta: ${error.message}`);
    }
}

export async function generateSolarPlantReport(solarPlantId: string, userId: string, year: number, callback: (err: Error | null, buffer: Buffer | null) => void) {
    try {
        const existingSolarPlant = await prismaClient.plant.findUnique({
            where: { id: solarPlantId },
            include: {
                client: true
            },
        });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        if (existingSolarPlant.client?.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão de acessar esta planta solar.');
        }

        let solarPlantInversor = existingSolarPlant.inversor;
        let powerData: number[] = [];
        let solarPlantParams = null;

        if (solarPlantInversor === Inversor.ABB) {
            const apiResponse = await fetchAbbData(existingSolarPlant.login, existingSolarPlant.password);
            solarPlantParams = { deviceData: '' };
            solarPlantParams.deviceData = apiResponse.totalData;

            let plantId = apiResponse.plantData.id;
            let chartResponse = await getChartAbbByType(existingSolarPlant.login, existingSolarPlant.password, year.toString(), 'mouth', plantId);

            powerData = chartResponse.chart.energy;
        } else if (solarPlantInversor === Inversor.CANADIAN) {
            const apiResponse = await fetchCanadianData(existingSolarPlant.login, existingSolarPlant.password);
            solarPlantParams = { deviceData: '' };
            solarPlantParams.deviceData = apiResponse.totalData;

            let plantId = apiResponse.plantData.id;
            let chartResponse = await getChartCanadianByType(existingSolarPlant.login, existingSolarPlant.password, year.toString(), 'mouth', plantId);

            powerData = chartResponse.chart.energy;
        } else if (solarPlantInversor === Inversor.DEYE) {
            const apiResponse = await fetchDeyeData(existingSolarPlant.login, existingSolarPlant.password);
            solarPlantParams = { deviceData: '' };
            solarPlantParams.deviceData = apiResponse.totalData;

            let plantId = apiResponse.plantData.id;
            let chartResponse = await getChartDeyeByType(existingSolarPlant.login, existingSolarPlant.password, year.toString(), 'mouth', plantId);

            powerData = chartResponse.chart.energy;

        } else if (solarPlantInversor === Inversor.GROWATT) {
            const apiResponse = await fetchPlantData(existingSolarPlant.login, existingSolarPlant.password);
            const plantServerID = Object.keys(apiResponse)[0];
            if (!plantServerID) throw new Error('No plant data available');
            const plantServer = apiResponse[plantServerID];
            const deviceObj = plantServer.devices;
            let deviceKey = Object.keys(deviceObj)[0];
            solarPlantParams = deviceObj[deviceKey];

            let chartResponse = await getChartByType(existingSolarPlant.login, existingSolarPlant.password, year.toString(), 'mouth', solarPlantParams.deviceData.plantId, solarPlantParams.deviceData.deviceTypeName, solarPlantParams.deviceData.alias);

            if (solarPlantParams.deviceData.deviceTypeName === 'max') {
                powerData = chartResponse.chart.energy;
            } else if (solarPlantParams.deviceData.deviceTypeName === 'tlx') {
                powerData = chartResponse.chart.charts.energy;
            }

        } else {
            throw new Error('Inversor não suportado na API.');
        }

        let totalGeneration = 0;
        let validMonths = 0;
        const currentMonth = new Date().getMonth();

        powerData.forEach((monthlyGeneration, index) => {
            if (year === new Date().getFullYear()) {
                if (index < currentMonth && monthlyGeneration > 0) {
                    totalGeneration += monthlyGeneration;
                    validMonths++;
                }
            } else {
                if (monthlyGeneration > 0) {
                    totalGeneration += monthlyGeneration;
                    validMonths++;
                }
            }
        });

        const generationMedia = validMonths > 0 ? totalGeneration / validMonths : 0;

        let chartBase64 = await generateChart(powerData, existingSolarPlant.estimatedGeneration);

        const htmlContent = `
            <html>
                <head>
                    <style>
                        body {
                            font-family: 'Helvetica', sans-serif;
                            font-size: 14px;
                            margin: 0;
                            padding: 0;
                            min-height: 100vh;
                            display: flex;
                            flex-direction: column;
                        }

                        h1 {
                            font-size: 16px;
                            text-align: center;
                        }

                        h4 {
                            margin-top: 0;
                            text-align: center;
                        }

                        h5 {
                            margin-bottom: 0;
                        }

                        hr {
                            width: 100%;
                        }

                        label {
                            font-weight: bold;
                        }

                        span {
                            font-size: 14px;
                            margin-left: 5px;
                        }

                        footer {
                            color: #333;
                            padding: 20px;
                            text-align: center;
                        }

                        .full {
                            flex: 1;
                        }

                        .header {
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                        }

                        .content {
                            display: flex;
                            flex-direction: column;
                            text-align: justify;
                        }

                        .content-title {
                            display: flex;
                            flex-direction: column;
                            width: 100%;
                            align-itens: center;
                            justify-content: center;
                        }

                        .content-dados {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                        }

                        .dados-producao {
                            margin-top: 25px;
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                        }

                        .column {
                            display: flex;
                            flex-direction: column;
                        }

                        .left {
                            margin-left: 5px;
                        }

                        .logo {
                            width: 150px;
                            display: block;
                            margin-left: auto;
                            margin-right: auto;
                        }

                    </style>
                </head>
                <body>
                    <div class='full'>
                        <div class='header'>
                            <img src="https://jplengenhariabr.com/wp-content/uploads/2022/07/CARTAO-jpl.png" alt='Logo' class='logo'/>
                            <hr />
                        </div>
                        <div class='content'>
                            <div class='content-title'>
                                <h1>RELATÓRIO DE PRODUÇÃO - USINA SOLAR</h1>
                            </div>
                            <div class='content-dados'>
                                <div class='column'>
                                    <div class='value-area'><label>NOME:</label><span>${existingSolarPlant.client?.name}</span></div>
                                    <div class='value-area'><label>CIDADE:</label><span>${existingSolarPlant.client?.address}</span></div>
                                    <div class='value-area'><label>TELEFONE:</label><span>${existingSolarPlant.client?.phone && formatPhone(existingSolarPlant.client.phone)}</span></div>
                                </div>
                                <div class='column left'>
                                    <div class='value-area'><label>COD. USINA:</label><span>${existingSolarPlant.code}</span></div>
                                    <div class='value-area'><label>LOCAL DE INSTALAÇÃO:</label><span>${existingSolarPlant.local}</span></div>
                                    <div class='value-area'><label>INVERSOR:</label><span>${existingSolarPlant.inversor}</span></div>
                                    <div class='value-area'><label>Nº DE PAINÉIS SOLARES:</label><span>${existingSolarPlant.numberPanel}</span></div>
                                    <div class='value-area'><label>POT. INSTALADA:</label><span>${existingSolarPlant.installedPower} KWp</span></div>
                                </div>
                            </div>
                            <hr />
                            <div class='graph-content'>
                                <h1>Geração Estimada X Real ao Longo do Ano (${year}) em KWh</h1>
                                <img src=${chartBase64} alt='Gráfico de Produção Anual' />
                            </div>
                            <div class='content-title'>
                                <h1>Média de Geração - ${(generationMedia).toFixed(2)} kWh/mês**</h1>
                                <h4>(${((generationMedia / existingSolarPlant.estimatedGeneration) * 100).toFixed(2)}% em relação a produção estimada)**</h5>
                            </div>
                            <div class='dados-producao'>
                                <div><label>PRODUÇÃO HOJE*:</label><span>${parseFloat(solarPlantParams.deviceData.eToday).toFixed(2)} KWh</span></div>
                                <div><label>PRODUÇÃO NO MÊS*:</label><span>${parseFloat(solarPlantParams.deviceData.eMonth).toFixed(2)} KWh</span></div>
                                <div><label>PRODUÇÃO TOTAL:</label><span>${solarPlantParams.deviceData.eTotal < 1000 ? (parseFloat(solarPlantParams.deviceData.eTotal)).toFixed(2) : (solarPlantParams.deviceData.eTotal / 1000).toFixed(2)} ${solarPlantParams.deviceData.eTotal < 1000 ? 'kWh' : 'MWh'}</span></div>
                            </div>
                            <h5>*Dados coletados no dia: ${new Date().toLocaleDateString()} às ${(new Date().getHours() >= 10 ? new Date().getHours() : '0' + new Date().getHours())}:${new Date().getMinutes() >= 10 ? new Date().getMinutes() : '0' + new Date().getMinutes()} hrs.</h5>
                            <h5>**Considerado para base de cálculo apenas meses finalizados, com a média aritimética até o último mês válido</h5>
                            <hr />
                        </div>
                    </div>
                    <footer>
                        <h4>JPL ENGENHARIA LTDA - CNPJ: 33.651.180/0001-09</h4>
                        <h4>R. Nicola Tesla, 189, Maria Manoela, São Miguel-RN, CEP 59.920-000</h4>
                        <h4>Telefone: (84) 9 9813-3818 / (83) 9 9615-1895 / (84) 9 9930-0037</h4>
                        <h4>jpl_engenharia@hotmail.com</h4>
                    </footer>
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
            console.error('Erro ao gerar relatório da usina solar: ' + error.message);
            throw new Error('Erro ao gerar relatório da usina solar: ' + error.message);
        } else {
            console.error('Erro ao gerar relatório da usina solar: Erro desconhecido');
            throw new Error('EErro ao gerar relatório da usina solar: Erro desconhecido');
        }
    }
}