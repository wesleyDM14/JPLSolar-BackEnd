import superagent from 'superagent';
import crypto from 'crypto';

const superApi = superagent.agent();

export const fetchCanadianData = async (login: string, password: string) => {
    try {
        let result: Record<string, any> = {};

        let hash = crypto.createHash('sha256');
        let hashPassword = hash.update(password, 'utf-8');
        let hashValue = hashPassword.digest('hex');

        let dashboard = await superApi.post('https://monitoring.csisolar.com/home/oauth-s/oauth/token').send({
            grant_type: 'password',
            username: login,
            clear_text_pwd: password,
            password: hashValue,
            client_id: 'test',
            identity_type: 2
        }).set('Content-Type', 'application/x-www-form-urlencoded');

        let acessToken = dashboard.body.access_token;

        result.weather = {};
        let getWeatherInfo = await superApi.get('https://monitoring.csisolar.com/home/region-s/weather/searchForecast?regionNationId=33&regionLevel1=598&regionLevel2=10450&lan=pt')
            .set('Authorization', `Bearer ${acessToken}`);
        let weatherTemp = getWeatherInfo.body.weatherList[0];
        result.weather.now = {};
        result.weather.basic = {};
        result.weather.now.tmp = weatherTemp.temp;
        result.weather.now.cond_txt = weatherTemp.weatherCode;

        let sr = new Date(weatherTemp.sunrise * 1000);
        let ss = new Date(weatherTemp.sunset * 1000);

        result.weather.basic.sr = sr.getHours() + ':' + sr.getMinutes();
        result.weather.basic.ss = ss.getHours() + ':' + ss.getMinutes();
        result.weather.basic.location = getWeatherInfo.body.regionName;

        let plantData = await superApi.post('https://monitoring.csisolar.com/home/maintain-s/operating/station/search?order.direction=DESC&order.property=id&page=1&size=20')
            .send({})
            .set('Authorization', `Bearer ${acessToken}`)
            .set('Content-Type', 'application/json');
        let temp = plantData.body.data[0].id;
        result.weather.basic.admin_area = plantData.body.data[0].locationAddress;
        result.plantData = {};
        result.plantData.id = temp;

        let totalData = await superApi.get(`https://monitoring.csisolar.com/home/maintain-s/operating/system/${temp}`)
            .set('Authorization', `Bearer ${acessToken}`);
        result.totalData = {};
        result.totalData.eMonth = totalData.body.generationMonth;
        result.totalData.eToday = totalData.body.generationValue;
        result.totalData.eTotal = totalData.body.generationTotal;

        let today = new Date();
        let dayChart = await superApi.get(`https://monitoring.csisolar.com/home/maintain-s/history/power/${temp}/record?year=${today.getFullYear()}&month=${today.getMonth() + 1}&day=${today.getUTCDate()}`)
            .set('Authorization', `Bearer ${acessToken}`);
        result.chart = {};
        result.chart.pac = [];

        dayChart.body.records.forEach((element: any) => {
            result.chart.pac.push({ x: element.dateTime * 1000, y: element.generationPower });
        });

        result.errorLog = [];
        let getErrorList = await superApi.post('https://monitoring.csisolar.com/home/maintain-s/operating/alert/search?order.direction=DESC&order.property=alertTime&page=1&size=40')
            .send({
                deviceType: '',
                language: 'pt',
                level: '',
                plantId: temp,
                startTime: '',
            }).set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${acessToken}`);

        let errorLogTemp = getErrorList.body.data;

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
        let getInverterDeviceInfo = await superApi.get(`https://monitoring.csisolar.com/home/maintain-s/operating/station/${temp}/inverter?order.direction=DESC&order.property=name&page=1&size=20&total=0`)
            .set('Authorization', `Bearer ${acessToken}`);

        result.deviceSN = {};
        result.deviceSN.alias = getInverterDeviceInfo.body.data[0].deviceSn;
        result.deviceSN.status = getInverterDeviceInfo.body.data[0].deviceState.toString();
        result.deviceSN.plantName = getInverterDeviceInfo.body.data[0].systemName;
        let updateDate = new Date(getInverterDeviceInfo.body.data[0].collectionTime);
        result.deviceSN.lastUpdateTime = updateDate.toISOString();
        result.deviceSN.datalogSn = getInverterDeviceInfo.body.data[0].parentSn;
        result.deviceSN.nominalPower = getInverterDeviceInfo.body.data[0].installedCapacity;
        result.deviceSN.pac = getInverterDeviceInfo.body.data[0].generationPower;
        result.deviceSN.deviceTypeName = 'max';

        result.deviceSNInfo = {};
        result.deviceSNInfo.deviceModel = getInverterDeviceInfo.body.data[0].type;
        result.deviceSNInfo.fwVersion = getInverterDeviceInfo.body.data[0].sensorCode;
        result.deviceSNInfo.communicationVersion = getInverterDeviceInfo.body.data[0].parentDeviceType;
        result.deviceSNInfo.innerVersion = getInverterDeviceInfo.body.data[0].productId;
        result.deviceSNInfo.modelText = getInverterDeviceInfo.body.data[0].serialNumber;

        result.datalogSNInfo = {};
        let dataloggInfo = await superApi.get(`https://monitoring.csisolar.com/home/maintain-s/operating/station/${temp}/collector?order.direction=DESC&order.property=name&page=1&size=20&total=1`)
            .set('Authorization', `Bearer ${acessToken}`);

        result.datalogSNInfo.simSignal = dataloggInfo.body.data[0].netState;
        result.datalogSNInfo.deviceType = dataloggInfo.body.data[0].type;
        result.datalogSNInfo.firmwareVersion = dataloggInfo.body.data[0].sensorCode;
        result.datalogSNInfo.ipAndPort = 'sem informação';
        result.datalogSNInfo.interval = 5;

        return result;

    } catch (error) {
        console.log(error);
        throw new Error('Erro ao consultar dados do erro da planta.');
    }
}