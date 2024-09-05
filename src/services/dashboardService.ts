import prismaClient from "../prisma";
import growatt from "growatt";
import superagent from "superagent";
import crypto from 'crypto';

class DashboardService {

    private growattApi = new growatt({});
    private growattApiC = new growatt({ indexCandI: true });

    private async fetchPlantData(login: string, password: string): Promise<any> {
        try {
            let plantData = await this.tryLoginAndFetchData(this.growattApi, login, password);

            if (Object.keys(plantData).length === 0) {
                plantData = await this.tryLoginAndFetchData(this.growattApiC, login, password);
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
            if (inverterServerID.length === 0) throw new Error('No devices found');

            const inverterServer = plantServer.devices[inverterServerID[0]];

            return {
                status: inverterServer.deviceData.status,
                eTotal: inverterServer.deviceData.eTotal,
            };
        } catch (error) {
            throw new Error(`Erro to get Growatt Data: ${login} - ${error}`);
        }
    }

    async getABBData(login: string, password: string) {
        try {
            await superagent.get('https://www.auroravision.net/ums/v1/login?setCookie=true').auth(login, password);
            const user = await superagent.get('https://www.auroravision.net/ums/v1/users/me/info');
            const plantId = user.body.plantGroupEntityId;
            const plant = await superagent.get(`https://https://www.auroravision.net/asset/v1/portfolios/${plantId}/plants?includePerformanceProfiles=true`);
            const startDate = new Date(plant.body[0].configuration.installDate);
            const endDate = new Date();
            const energyData = await superagent.get(`https://www.auroravision.net/telemetry/v1/plantGroups/${plantId}/energy/GenerationEnergy?sdt=${startDate.toISOString()}&edt=${endDate.toISOString()}`);

            const deviceInfo = await superagent.get(`https://www.auroravision.net/asset/v1/plants/${plant.body[0].entityID}/devices?hierarchyType=TREE`);
            const device = deviceInfo.body.length > 1 ? deviceInfo.body[1] : deviceInfo.body[0];

            await superagent.get('https://www.auroravision.net/ums/v1/logout');

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
            const dashboard = await superagent.post('https://globalhome.solarmanpv.com/mdc-eu/oauth-s/oauth/token').send({
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
            const plantList = await superagent.post('https://globalhome.solarmanpv.com/maintain-s/operating/station/search?order.direction=DESC&order.property=id&page=1&size=20')
                .set('Authorization', `Bearer ${acessToken}`);

            const plantSolar = plantList.body.data[0];
            const plantDetail = await superagent.get(`https://globalhome.solarmanpv.com/maintain-s/operating/station/information/${plantSolar.id}?language=pt`)
                .set('Authorization', `Bearer ${acessToken}`);

            const deviceInfo = await superagent.get(`https://home.solarmanpv.com/maintain-s/fast/device/${plantSolar.id}/device-list?deviceType=INVERTER`)
                .set('Authorization', `Bearer ${acessToken}`);

            await superagent.post('https://home.solarmanpv.com/backyard-api-s/announcement/content').set('Content-Type', 'application/json');

            return {
                status: deviceInfo.body[0].deviceStatus.toString(),
                eTotal: plantDetail.body.generationTotal
            };
        } catch (error) {
            throw new Error(`Erro to get Deye Data: ${login} - ${error}`);
        }
    }

    async getCanadianData(login: string, password: string) {
        try {
            const hash = crypto.createHash('sha256').update(password).digest('hex');
            const dashboard = await superagent.post('https://monitoring.csisolar.com/home/oauth-s/oauth/token').send({
                grant_type: 'password',
                username: login,
                clear_text_pwd: password,
                password: hash,
                client_id: 'test',
                identity_type: 2
            }).set('Content-Type', 'application/x-www-form-urlencoded');

            const acessToken = dashboard.body.access_token;
            const plantData = await superagent.post('https://monitoring.csisolar.com/home/maintain-s/operating/station/search?order.direction=DESC&order.property=id&page=1&size=20')
                .set('Authorization', `Bearer ${acessToken}`)
                .set('Content-Type', 'application/json');

            const plantId = plantData.body.data[0].id;
            const totalData = await superagent.get(`https://monitoring.csisolar.com/home/maintain-s/operating/system/${plantId}`)
                .set('Authorization', `Bearer ${acessToken}`);

            const deviceInfo = await superagent.get(`https://monitoring.csisolar.com/home/maintain-s/operating/station/${plantId}/inverter?order.direction=DESC&order.property=name&page=1&size=20&total=0`)
                .set('Authorization', `Bearer ${acessToken}`);

            return {
                status: deviceInfo.body.data[0].deviceState.toString(),
                eTotal: totalData.body.generationTotal
            };
        } catch (error) {
            throw new Error(`Erro to get Canadian Data: ${login} - ${error}`);
        }
    }

    async getDashBoardData(userId: string) {
        const plants = await prismaClient.plant.findMany({
            where: { userId },
            include: {
                client: true,
            }
        });

        const formattedPlants = plants.map(plant => ({
            id: plant.id,
            status: plant.status,
            eTotal: plant.eTotal,
            clientName: plant.client.name,
            solarPlantCode: plant.code,
        }))

        const plantsCount = plants.length;

        const totalPowerInstalled = plants.reduce((total, plant) => total + plant.installedPower, 0);

        const formatPower = (power: number) => {
            if (power >= 1e6) {
                return (power / 1e6).toFixed(2) + ' MWp';
            } else if (power >= 1e3) {
                return (power / 1e3).toFixed(2) + ' KWp';
            } else {
                return power.toFixed(2) + ' Wp';
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