import prismaClient from "../prisma";
import growatt from "growatt";
import superagent from "superagent";
import crypto from 'crypto';
import { scrappingDashboard, scrappingSolisData } from "../Api/WebScrapping/solisWebScrapping";

const superApi = superagent.agent();

class DashboardService {

    private async fetchPlantData(login: string, password: string): Promise<any> {
        try {
            let growattApi = new growatt({});
            let plantData = await this.tryLoginAndFetchData(growattApi, login, password);

            if (Object.keys(plantData).length === 0) {
                let growattApiC = new growatt({ indexCandI: true });

                plantData = await this.tryLoginAndFetchData(growattApiC, login, password);
            }

            return plantData;
        } catch (error: any) {
            throw new Error(`Erro ao buscar dados da planta: ${error.message}`);
        }
    }

    private async tryLoginAndFetchData(api: growatt, login: string, password: string): Promise<any> {
        const { result } = await api.login(login, password);
        if (result !== 1) throw new Error('Erro no login');

        const plantData = await api.getAllPlantData();
        await api.logout();
        return plantData;
    }

    async getGrowattData(login: string, password: string) {
        try {
            const plantData = await this.fetchPlantData(login, password);

            const plantServerID = Object.keys(plantData)[0];
            if (!plantServerID) throw new Error('No plant data available');

            const plantServer = plantData[plantServerID];
            const inverterServerID = Object.keys(plantServer.devices);

            if (inverterServerID.length > 0) {
                const inverterServer = plantServer.devices[inverterServerID[0]];
                return {
                    status: inverterServer.deviceData.status,
                    eTotal: inverterServer.deviceData.eTotal,
                };
            } else {
                return {
                    status: '-1',
                    eTotal: plantServer.plantData.eTotal,
                };
            }

        } catch (error) {
            throw new Error(`Erro to get Growatt Data: ${login} - ${error}`);
        }
    }

    async getGoodweData(login: string, password: string) {
        try {
            const superApiInstance = superagent.agent();
            const loginRes = await superApiInstance
                .post('https://www.semsportal.com/api/v1/Common/CrossLogin')
                .set('Content-Type', 'application/json')
                .set('Token', JSON.stringify({
                    version: 'v2.1.0',
                    client: 'ios',
                    language: 'en'
                }))
                .send({
                    account: login,
                    pwd: password
                });

            const loginData = loginRes.body.data;

            if (!loginData?.token || !loginData?.uid || !loginData?.timestamp) {
                throw new Error(`Dados incompletos no login para ${login}. Resposta: ${JSON.stringify(loginRes.body)}`);
            }

            const tokenHeader = JSON.stringify({
                uid: loginData.uid,
                timestamp: loginData.timestamp,
                token: loginData.token,
                client: 'ios',
                version: 'v2.1.0',
                language: 'pt-pt'
            });

            const apiBase = loginRes.body.api || 'https://us.semsportal.com/api/';

            const stationRes = await superApiInstance
                .post(`${apiBase}PowerStation/GetPowerStationIdByOwner`)
                .set('Content-Type', 'application/json')
                .set('token', tokenHeader)
                .send({});

            const powerStationId = stationRes.body.data;

            if (!powerStationId) {
                throw new Error(`Falha ao obter o ID da usina para login ${login}. Resposta da API: ${JSON.stringify(stationRes.body)}`);
            }

            const plantDetailRes = await superApiInstance
                .post('https://us.semsportal.com/api/v3/PowerStation/GetPlantDetailByPowerstationId')
                .set('Content-Type', 'application/json')
                .set('token', tokenHeader)
                .send({ powerStationId });

            return {
                status: plantDetailRes.body.data.info.status.toString(),
                eTotal: plantDetailRes.body.data.kpi.total_power,
            };


        } catch (error) {
            throw new Error(`Erro to get Goodwe Data: ${login} - ${error}`);
        }
    }

    async getABBData(login: string, password: string) {
        try {
            await superApi.get('https://www.auroravision.net/ums/v1/login?setCookie=true').auth(login, password);
            const user = await superApi.get('https://www.auroravision.net/ums/v1/users/me/info');
            const plantId = user.body.plantGroupEntityId;
            const plant = await superApi.get(`https://www.auroravision.net/asset/v1/portfolios/${plantId}/plants?includePerformanceProfiles=true`);
            const startDate = new Date(plant.body[0].configuration.installDate);
            const endDate = new Date();
            const energyData = await superApi.get(`https://www.auroravision.net/telemetry/v1/plantGroups/${plantId}/energy/GenerationEnergy?sdt=${startDate.toISOString()}&edt=${endDate.toISOString()}`);

            const deviceInfo = await superApi.get(`https://www.auroravision.net/asset/v1/plants/${plant.body[0].entityID}/devices?hierarchyType=TREE`);
            const device = deviceInfo.body.length > 1 ? deviceInfo.body[1] : deviceInfo.body[0];

            await superApi.get('https://www.auroravision.net/ums/v1/logout');

            return {
                status: device.state === 'ACTIVE' ? '1' : device.state === 'DELINQUENT' ? '-1' : '0',
                eTotal: energyData.body[0].value
            };
        } catch (error) {
            throw new Error(`Erro to get ABB Data: ${login} - ${error}`);
        }
    }

    async getDeyeData(login: string, password: string) {
        try {
            const hash = crypto.createHash('sha256').update(password).digest('hex');

            const dashboard = await superApi.post('https://globalhome.solarmanpv.com/mdc-eu/oauth-s/oauth/token').send({
                grant_type: 'mdc_password',
                username: login,
                clear_text_pwd: password,
                password: hash,
                identity_type: 2,
                client_id: 'test',
                system: 'SOLARMAN',
                area: 'BR'
            }).set('Content-Type', 'application/x-www-form-urlencoded');

            const acessToken = dashboard.body.access_token;

            let plantList = await superApi.post('https://globalhome.solarmanpv.com/maintain-s/operating/station/search?order.direction=DESC&order.property=id&page=1&size=20').send({})
                .set('Authorization', `Bearer ${acessToken}`);

            let plantSolar = plantList.body.data[0];

            let temp = plantSolar.id;

            const plantDetail = await superApi.get(`https://globalhome.solarmanpv.com/maintain-s/operating/station/information/${temp}?language=pt`)
                .set('Authorization', `Bearer ${acessToken}`);

            const deviceInfo = await superApi.get(`https://home.solarmanpv.com/maintain-s/fast/device/${temp}/device-list?deviceType=INVERTER`)
                .set('Authorization', `Bearer ${acessToken}`);

            let inverterStatus = deviceInfo.body.length > 0 ? deviceInfo.body[0].deviceStatus.toString() : '-1';

            let logout = await superApi.post('https://globalhome.solarmanpv.com/oauth2-s/oauth/logout').send({
            }).set('Content-Type', 'application/json').set('Authorization', `Bearer ${acessToken}`);

            return {
                status: inverterStatus,
                eTotal: plantDetail.body.generationTotal
            };
        } catch (error) {
            throw new Error(`Erro to get Deye Data: ${login} - ${error}`);
        }
    }

    async getCanadianData(login: string, password: string) {
        try {
            const hash = crypto.createHash('sha256').update(password).digest('hex');

            const platform = await superApi.post('https://webmonitoring-gl.csisolar.com/home/backyard-api-s/app/upgrade/add-version')
                .send({
                    channel: "Web",
                    innerVersion: "122",
                    platform: "CSI Cloud",
                    platformCode: "CSI_CLOUD",
                    type: 1,
                    version: "2.3.1"
                })
                .set('Content-Type', 'application/json');

            const dashboard = await superApi.post('https://webmonitoring-gl.csisolar.com/home/oauth-s/oauth/token').send({
                grant_type: 'mdc_password',
                username: login,
                clear_text_pwd: password,
                password: hash,
                identity_type: 2,
                client_id: 'test',
                system: 'CSICloud',
            }).set('Content-Type', 'application/x-www-form-urlencoded');

            const accessToken = dashboard.body.access_token;

            const plantData = await superApi.post('https://webmonitoring-gl.csisolar.com/home/maintain-s/operating/station/search?order.direction=DESC&order.property=id&page=1&size=20').send({})
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Content-Type', 'application/json');

            const plantId = plantData.body.data[0].id;

            const totalData = await superApi.get(`https://webmonitoring-gl.csisolar.com/home/maintain-s/operating/system/${plantId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            const deviceInfo = await superApi.get(`https://webmonitoring-gl.csisolar.com/home/maintain-s/operating/station/${plantId}/inverter?order.direction=DESC&order.property=name&page=1&size=20&total=0`)
                .set('Authorization', `Bearer ${accessToken}`);

            return {
                status: deviceInfo.body.data[0].deviceState.toString(),
                eTotal: totalData.body.generationTotal
            };
        } catch (error) {
            throw new Error(`Erro to get Canadian Data: ${login} - ${error}`);
        }
    }

    async getSolisData(login: string, password: string) {
        try {
            const scrappingData = await scrappingDashboard(login, password);

            const stationListResult = scrappingData.find(item => item.url.includes('/station/list'));
            const detailMixResult = scrappingData.find(item => item.url.includes('/station/detailMix'));

            const stationListData = stationListResult?.data?.data;
            const detailMixData = detailMixResult?.data?.data;

            return {
                status: stationListData.page?.records?.[0]?.state.toString(),
                eTotal: detailMixData.allEnergy1
            };
        } catch (error) {
            throw new Error(`Erro to get Canadian Data: ${login} - ${error}`);
        }
    }

    async getDashBoardData(userId: string) {
        const plants = await prismaClient.plant.findMany({
            where: { montadorId: userId },
            include: {
                client: true,
            }
        });

        const formattedPlants = plants.map(plant => ({
            id: plant.id,
            status: plant.status,
            eTotal: plant.eTotal,
            clientName: plant.client?.name,
            solarPlantCode: plant.code,
        }));

        const plantsCount = plants.length;

        const totalPowerInstalled = plants.reduce((total, plant) => total + plant.installedPower, 0);

        const formatPower = (power: number) => {
            if (power >= 1e6) {
                return (power / 1e6).toFixed(2) + ' GWp';
            } else if (power >= 1e3) {
                return (power / 1e3).toFixed(2) + ' MWp';
            } else {
                return power.toFixed(2) + ' kWp';
            }
        };

        return {
            totalPlant: plantsCount,
            totalPowerInstalled: formatPower(totalPowerInstalled),
            plants: formattedPlants,
        }
    }

}

export default DashboardService;