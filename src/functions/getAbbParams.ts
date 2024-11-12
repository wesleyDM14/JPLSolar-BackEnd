import superagent from 'superagent';
const cookie = require('superagent-cookie');

const superApi = superagent.agent();


export const fetchAbbData = async (login: string, password: string) => {
    try {
        let result: Record<string, any> = {};
        let headers: Record<string, any> = {};

        let dashboard = await superApi.get('https://www.auroravision.net/ums/v1/login?setCookie=true')
            .auth(login, password)
            .http2()
            .then((res) => {
                cookie.save(res.headers['set-cookie'], 'abbCookiers');
                headers = {
                    'cookie': cookie.use('abbCookiers')
                }
            });

        let user = await superApi.get('https://www.auroravision.net/ums/v1/users/me/info').set(headers);

        result.plantData = {};

        let plantId = user.body.plantGroupEntityId;
        result.plantData.id = plantId;

        let plant = await superApi.get(`https://www.auroravision.net/asset/v1/portfolios/${plantId}/plants?includePerfomanceProfiles=true?includePollutionConstants=true`).set(headers);
        let temp = plant.body[0].entityID;

        result.weather = {};
        result.weather.now = {};
        result.weather.basic = {};

        result.weather.basic.location = plant.body[0].location.city;
        result.weather.basic.admin_area = plant.body[0].location.region;

        let getWeather = await superApi.get(`https://www.auroravision.net/weather/v1/plants/${temp}/status?includeForecasts=true`).set(headers)
            .then((response) => {
                result.weather.now.tmp = response.body.condition.temperature.value;
                result.weather.now.cond_txt = response.body.condition.code;
                result.weather.basic.sr = new Date(response.body.time.sunrise).getHours() + ':' + new Date(response.body.time.sunrise).getMinutes();
                result.weather.basic.ss = new Date(response.body.time.sunset).getHours() + ':' + new Date(response.body.time.sunset).getMinutes();
            })
            .catch((err) => {
                result.weather.now.tmp = '-';
                result.weather.now.cond_txt = '-';
                result.weather.basic.sr = '-';
                result.weather.basic.ss = '-';
            });

        result.plantData.co2 = '';
        result.plantData.tree = '';

        result.totalData = {};
        let startDate = new Date();
        startDate.setHours(0);
        startDate.setMinutes(0);

        let endDate = new Date();

        let energyData = await superApi.get(`https://www.auroravision.net/telemetry/v1/plantGroups/${plantId}/energy/GenerationEnergy?sdt=${startDate.toISOString()}&edt=${endDate.toISOString()}`).set(headers);
        result.totalData.eToday = energyData.body[0].value;

        startDate.setDate(1);
        energyData = await superApi.get(`https://www.auroravision.net/telemetry/v1/plantGroups/${plantId}/energy/GenerationEnergy?sdt=${startDate.toISOString()}&edt=${endDate.toISOString()}`).set(headers);
        result.totalData.eMonth = energyData.body[0].value;

        startDate = new Date(plant.body[0].configuration.installDate);
        energyData = await superApi.get(`https://www.auroravision.net/telemetry/v1/plantGroups/${plantId}/energy/GenerationEnergy?sdt=${startDate.toISOString()}&edt=${endDate.toISOString()}`).set(headers);
        result.totalData.eTotal = energyData.body[0].value;

        startDate = new Date();
        startDate.setHours(0);
        startDate.setMinutes(0);
        endDate.setHours(23);
        endDate.setMinutes(59);

        let dayChart = await superApi.get(`https://www.auroravision.net/telemetry/v1/plants/${temp}/power/GenerationPower?agp=Min15&afx=Avg&sdt=${startDate.toISOString()}&edt=${endDate.toISOString()}`).set(headers);

        result.chart = {};
        result.chart.pac = [];

        dayChart.body.forEach((element: any) => {
            result.chart.pac.push({ x: element.start, y: element.value });
        });

        result.errorLog = [];
        startDate = new Date();
        startDate.setDate(1);
        startDate.setMonth(0);

        let getDataErrorLog = await superApi.get(`https://www.auroravision.net/event/v1/portfolios/${plantId}/plants/${temp}/events?eventGroup=SOURCE&eventState=ALL&sdt=${startDate.toISOString()}&edt=${endDate.toISOString()}&locale=en&sortDirection=DESC&offset=0`).set(headers);
        let totalResult = getDataErrorLog.body.totalResults;
        let errorLogTemp = [];
        errorLogTemp.push(getDataErrorLog.body.events);

        if (totalResult > 30) {
            for (var i = 30; i < totalResult; i = i + 30) {
                getDataErrorLog = await superApi.get(`https://www.auroravision.net/event/v1/portfolios/${plantId}/plants/${temp}/events?eventGroup=SOURCE&eventState=ALL&sdt=${startDate.toISOString()}&edt=${endDate.toISOString()}&locale=en&sortDirection=DESC&offset=${i}`).set(headers);
                errorLogTemp.push(getDataErrorLog.body.events);
            }
        }

        errorLogTemp.forEach(element => {
            element.forEach((option: any) => {
                let itemTmp: Record<string, any> = {};
                itemTmp.alias = option.entityID;
                itemTmp.deviceType = option.eventType.deviceType;
                itemTmp.sn = option.entityName;
                itemTmp.time = option.startDate;
                itemTmp.eventName = option.eventType.code.name;
                itemTmp.eventId = option.eventType.code.id;
                itemTmp.solution = option.eventType.code.description;
                result.errorLog.push(itemTmp);
            });
        });

        result.deviceSN = {};
        let getDeviceInfo = await superApi.get(`https://www.auroravision.net/asset/v1/plants/${temp}/devices?hierarchyType=TREE`).set(headers);

        let deviceTemp: Record<string, any> = {};
        if (getDeviceInfo.body.length > 1) {
            deviceTemp = getDeviceInfo.body[1];
        } else {
            deviceTemp = getDeviceInfo.body[0];
        }

        result.deviceSN.alias = deviceTemp.serialNumber;
        result.deviceSN.status = deviceTemp.state === 'ACTIVE' ? '1' : deviceTemp.state === 'DELINQUENT' ? '-1' : '0';
        result.deviceSN.plantName = plant.body[0].name;

        let deviceId = deviceTemp.entityID;
        let lastDate = await superApi.get(`https://www.auroravision.net/telemetry/v1/devices/${deviceId}/LatestDate`).set(headers);
        let lastDateTemp = new Date(parseInt(lastDate.body[0].value));

        result.deviceSN.lastUpdateTime = lastDateTemp.toISOString();
        result.deviceSN.datalogSn = deviceTemp.logger.deviceID;
        result.deviceSN.nominalPower = deviceTemp.panelNominalPower;
        result.deviceSN.pac = '';
        result.deviceSN.deviceTypeName = 'max';

        result.deviceSNInfo = {};
        result.deviceSNInfo.deviceModel = deviceTemp.model;
        result.deviceSNInfo.fwVersion = deviceTemp.firmwareVersion;
        result.deviceSNInfo.communicationVersion = deviceTemp.deviceCommunicationInterface;
        result.deviceSNInfo.innerVersion = deviceTemp.description;
        result.deviceSNInfo.modelText = deviceTemp.name;

        result.datalogSNInfo = {};
        result.datalogSNInfo.simSignal = 'no data';
        result.datalogSNInfo.deviceType = deviceTemp.logger.description;
        result.datalogSNInfo.firmwareVersion = deviceTemp.logger.firmwareVersion;
        result.datalogSNInfo.ipAndPort = deviceTemp.logger.mac;
        result.datalogSNInfo.interval = 5;

        let logoult = await superApi.get('https://www.auroravision.net/ums/v1/logout');

        return result;
    } catch (error) {
        console.log(error);
        throw new Error('Erro ao consultar dados individuais da planta solar.');
    }
}