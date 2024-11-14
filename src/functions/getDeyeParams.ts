import superagent from 'superagent';
import crypto from 'crypto';

const superApi = superagent.agent();

export const fetchDeyeData = async (login: string, password: string) => {
    try {
        let result: Record<string, any> = {};

        const hash = crypto.createHash('sha256');
        let hashPassword = hash.update(password, 'utf-8');
        let hashValue = hashPassword.digest('hex');

        let dashboard = await superApi.post('https://globalhome.solarmanpv.com/mdc-eu/oauth-s/oauth/token').send({
            grant_type: 'mdc_password',
            username: login,
            clear_text_pwd: password,
            password: hashValue,
            identity_type: 2,
            client_id: 'test',
            system: 'SOLARMAN',
            area: 'BR'
        }).set('Content-Type', 'application/x-www-form-urlencoded');

        let acessToken = dashboard.body.access_token;

        let plantList = await superApi.post('https://globalhome.solarmanpv.com/maintain-s/operating/station/search?order.direction=DESC&order.property=id&page=1&size=20').send({})
            .set('Authorization', `Bearer ${acessToken}`);

        let plantSolar = plantList.body.data[0];
        let temp = plantSolar.id;

        result.plantData = {};
        result.plantData.id = temp;

        let plantDetail = await superApi.get(`https://globalhome.solarmanpv.com/maintain-s/operating/station/information/${temp}?language=pt`)
            .set('Authorization', `Bearer ${acessToken}`);

        result.weather = {};
        result.weather.now = {};
        result.weather.basic = {};

        result.weather.now.tmp = plantDetail.body.temperature;
        result.weather.now.cond_txt = plantDetail.body.weather;
        result.weather.basic.sr = '-';
        result.weather.basic.ss = '-';
        result.weather.basic.location = plantDetail.body.locationAddress;
        result.weather.basic.admin_area = '';

        result.totalData = {};
        result.totalData.eMonth = plantDetail.body.generationMonth;
        result.totalData.eToday = plantDetail.body.generationValue;
        result.totalData.eTotal = plantDetail.body.generationTotal;

        let energySaved = await superApi.post('https://globalhome.solarmanpv.com/maintain-s/operating/station/generation/energy-saved').send({
            systemId: temp
        })
            .set('Authorization', `Bearer ${acessToken}`)
            .set('Content-Type', 'application/json');

        result.plantData.tree = energySaved.body.treesPlanted;
        result.plantData.co2 = energySaved.body.emissionReductionCO2;

        let today = new Date().toLocaleDateString().split('/');

        let getChartByDay = await superApi.get(`https://home.solarmanpv.com/maintain-s/history/power/${temp}/record?year=${today[2]}&month=${today[1]}&day=${today[0]}`)
            .set('Authorization', `Bearer ${acessToken}`);

        let tempChart = getChartByDay.body.records;
        result.chart = {};
        result.chart.pac = [];
        tempChart.forEach((element: any) => {
            result.chart.pac.push({
                x: new Date(parseInt((element.dateTime * 1000).toString())),
                y: element.generationPower
            });
        });

        let getDataErrorLog = await superApi.post('https://home.solarmanpv.com/maintain-s/operating/alert/search?order.direction=DESC&order.property=alertTime&page=1&size=20&total=0')
            .send({
                deviceType: "",
                language: "pt",
                level: "",
                levelList: null,
                plantId: temp,
                startTime: ""
            })
            .set('Authorization', `Bearer ${acessToken}`)
            .set('Content-Type', 'application/json');

        let errorLogTemp = getDataErrorLog.body.data;
        result.errorLog = [];

        errorLogTemp.forEach((element: any) => {
            let date = new Date(element.alertTime * 1000);
            if (date.getFullYear() === new Date().getFullYear()) {
                let itemTmp: Record<string, any> = {};
                itemTmp.alias = element.deviceSn;
                itemTmp.deviceType = element.deviceType;
                itemTmp.sn = element.deviceSn;
                itemTmp.time = date.toISOString();
                itemTmp.eventName = element.showName;
                itemTmp.eventId = element.addr;
                itemTmp.solution = '-';
                result.errorLog.push(itemTmp);
            }
        });

        let getInverterDeviceInfo = await superApi.get(`https://home.solarmanpv.com/maintain-s/fast/device/${temp}/device-list?deviceType=INVERTER`)
            .set('Authorization', `Bearer ${acessToken}`);

        let getDatalogDeviceInfo = await superApi.get(`https://home.solarmanpv.com/maintain-s/fast/device/${temp}/device-list?deviceType=COLLECTOR`)
            .set('Authorization', `Bearer ${acessToken}`);

        result.deviceSN = {};
        result.deviceSN.alias = getInverterDeviceInfo.body[0].deviceSn;
        result.deviceSN.status = getInverterDeviceInfo.body[0].deviceStatus.toString();
        result.deviceSN.plantName = plantDetail.body.name;
        let updateDate = new Date(getInverterDeviceInfo.body[0].collectionTime * 1000);
        result.deviceSN.lastUpdateTime = updateDate.toISOString();

        result.deviceSN.datalogSn = getDatalogDeviceInfo.body[0].deviseSn;

        result.deviceSN.nominalPower = getInverterDeviceInfo.body[0].generation;
        result.deviceSN.pac = getInverterDeviceInfo.body[0].generationPower;
        result.deviceSN.deviceTypeName = 'max';

        result.deviceSNInfo = {};
        result.deviceSNInfo.deviceModel = getInverterDeviceInfo.body[0].deviceType;
        result.deviceSNInfo.fwVersion = getInverterDeviceInfo.body[0].deviceId;
        result.deviceSNInfo.communicationVersion = getDatalogDeviceInfo.body[0].communicationMode;
        result.deviceSNInfo.innerVersion = getInverterDeviceInfo.body[0].productId;
        result.deviceSNInfo.modelText = getDatalogDeviceInfo.body[0].productId + ' ' + getInverterDeviceInfo.body[0].deviceType;

        result.datalogSNInfo = {};
        result.datalogSNInfo.simSignal = getDatalogDeviceInfo.body[0].signalIntensity;
        result.datalogSNInfo.deviceType = getDatalogDeviceInfo.body[0].deviceType;
        result.datalogSNInfo.firmwareVersion = getDatalogDeviceInfo.body[0].sensor;
        result.datalogSNInfo.ipAndPort = getDatalogDeviceInfo.body[0].productId;
        result.datalogSNInfo.interval = 5;

        let logout = await superApi.post('https://globalhome.solarmanpv.com/oauth2-s/oauth/logout').send({
        }).set('Content-Type', 'application/json').set('Authorization', `Bearer ${acessToken}`);

        return result;

    } catch (error) {
        console.log(error);
        throw new Error('Erro ao consultar dados do erro da planta.');
    }
}

export const getDeyeErrorDataListForYear = async (login: string, password: string, year: number, plantId: string) => {
    try {
        let result: Record<string, any> = {};
        result.errorLog = [];

        const hash = crypto.createHash('sha256');
        let hashPassword = hash.update(password, 'utf-8');
        let hashValue = hashPassword.digest('hex');

        let dashboard = await superApi.post('https://globalhome.solarmanpv.com/mdc-eu/oauth-s/oauth/token').send({
            grant_type: 'mdc_password',
            username: login,
            clear_text_pwd: password,
            password: hashValue,
            identity_type: 2,
            client_id: 'test',
            system: 'SOLARMAN',
            area: 'BR'
        }).set('Content-Type', 'application/x-www-form-urlencoded');

        const acessToken = dashboard.body.access_token;

        let getDataErrorLog = await superApi.post('https://home.solarmanpv.com/maintain-s/operating/alert/search?order.direction=DESC&order.property=alertTime&page=1&size=20&total=0')
            .send({
                deviceType: "",
                language: "pt",
                level: "",
                levelList: null,
                plantId: plantId,
                startTime: ""
            })
            .set('Authorization', `Bearer ${acessToken}`)
            .set('Content-Type', 'application/json');

        let errorLogTemp = getDataErrorLog.body.data;
        errorLogTemp.forEach((element: any) => {
            let data = new Date(element.alertTime * 1000);
            if (data.getFullYear() === year) {
                let itemTmp: Record<string, any> = {};
                itemTmp.alias = element.deviceSn;
                itemTmp.deviceType = element.deviceType;
                itemTmp.sn = element.deviceSn;
                itemTmp.time = data.toISOString();
                itemTmp.eventName = element.showName;
                itemTmp.eventId = element.addr;
                itemTmp.solution = '-';
                result.errorLog.push(itemTmp);
            }
        });

        let logout = await superApi.post('https://globalhome.solarmanpv.com/oauth2-s/oauth/logout').send({
        }).set('Content-Type', 'application/json').set('Authorization', `Bearer ${acessToken}`);

        return result;
    } catch (error) {
        console.log(error);
        throw new Error('Erro ao consultar dados do erro da planta.');
    }
}

export const getChartDeyeByType = async (login: string, password: string, date: string, type: string, plantId: string) => {
    try {

        const hash = crypto.createHash('sha256');
        let hashPassword = hash.update(password, 'utf-8');
        let hashValue = hashPassword.digest('hex');

        let result: Record<string, any> = {};

        let dashboard = await superApi.post('https://globalhome.solarmanpv.com/mdc-eu/oauth-s/oauth/token').send({
            grant_type: 'mdc_password',
            username: login,
            clear_text_pwd: password,
            password: hashValue,
            identity_type: 2,
            client_id: 'test',
            system: 'SOLARMAN',
            area: 'BR'
        }).set('Content-Type', 'application/x-www-form-urlencoded');

        const acessToken = dashboard.body.access_token;

        if (type === 'time') {
            let today = date.split('-');

            let dayChart = await superApi.get(`https://home.solarmanpv.com/maintain-s/history/power/${plantId}/record?year=${today[0]}&month=${today[1]}&day=${today[2]}`)
                .set('Authorization', `Bearer ${acessToken}`);

            let tempChart = dayChart.body.records;
            result.chart = {};
            result.chart.pac = [];
            tempChart.forEach((element: any) => {
                const timestamp = Number(element.dateTime) * 1000;
                result.chart.pac.push({ x: new Date(timestamp), y: element.generationPower });
            });
        } else if (type === 'day') {
            let today = date.split('-');
            let dayChart = await superApi.get(`https://home.solarmanpv.com/maintain-s/history/power/${plantId}/stats/month?year=${today[0]}&month=${today[1]}`)
                .set('Authorization', `Bearer ${acessToken}`);
            result.chart = {};
            result.chart.energy = [];
            let tempChart = dayChart.body.records;
            tempChart.forEach((element: any) => {
                result.chart.energy.push(element.generationValue);
            });
        } else if (type === 'mouth') {
            let dayChart = await superApi.get(`https://home.solarmanpv.com/maintain-s/history/power/${plantId}/stats/year?year=${date}`)
                .set('Authorization', `Bearer ${acessToken}`);
            result.chart = {};
            result.chart.energy = [12];
            dayChart.body.records.forEach((element: any) => {
                result.chart.energy[element.month - 1] = element.generationValue;
            });
            for (let index = 0; index < result.chart.energy.length; index++) {
                const element = result.chart.energy[index];
                if (!element) {
                    result.chart.energy[index] = 0;
                }
            }
        } else if (type === 'year') {
            let dayChart = await superApi.get(`https://home.solarmanpv.com/maintain-s/history/power/${plantId}/stats/total`)
                .set('Authorization', `Bearer ${acessToken}`);
            result.chart = {};
            result.chart.energy = [];
            dayChart.body.records.forEach((element: any) => {
                result.chart.energy.push(element.generationValue);
            });
        }

        let logout = await superApi.post('https://globalhome.solarmanpv.com/oauth2-s/oauth/logout').send({
        }).set('Content-Type', 'application/json').set('Authorization', `Bearer ${acessToken}`);

        return result;
    } catch (error) {
        console.log(error);
        throw new Error('Erro ao consultar dados de geração da planta.');
    }
}