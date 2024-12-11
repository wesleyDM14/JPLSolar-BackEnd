import superagent from 'superagent';
import crypto from 'crypto';
import { lastDayOfMonth } from 'date-fns';

const superApi = superagent.agent();

export const fetchCanadianData = async (login: string, password: string) => {
    try {
        let result: Record<string, any> = {};

        const hash = crypto.createHash('sha256');
        let hashPassword = hash.update(password, 'utf-8');
        let hashValue = hashPassword.digest('hex');

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

        const dashboard = await superApi.post('https://webmonitoring-gl.csisolar.com/home/oauth-s/oauth/token')
            .send({
                grant_type: 'mdc_password',
                username: login,
                clear_text_pwd: password,
                password: hashValue,
                identity_type: 2,
                client_id: 'test',
                system: 'CSICloud',
            })
            .set('Content-Type', 'application/x-www-form-urlencoded');

        const accessToken = dashboard.body.access_token;

        const getSystemData = await superApi.post('https://webmonitoring-gl.csisolar.com/home/maintain-s/operating/station/search?order.direction=DESC&order.property=id&page=1&size=20')
            .send({})
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Content-Type', 'application/json');

        result.weather = {};
        result.plantData = {};

        let tempSystemData = getSystemData.body.data[0];
        let plantId = tempSystemData.id;

        result.plantData.id = plantId;

        const getWeatherInfo = await superApi.get(`https://webmonitoring-gl.csisolar.com/home/region-s/weather/searchForecast?regionNationId=${tempSystemData.regionNationId}&regionLevel1=${tempSystemData.regionLevel1}&regionLevel2=${tempSystemData.regionLevel2}&lan=pt`)
            .set('Authorization', `Bearer ${accessToken}`);

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
        result.weather.basic.admin_area = tempSystemData.locationAddress;

        const totalData = await superApi.get(`https://webmonitoring-gl.csisolar.com/home/maintain-s/operating/system/${plantId}`)
            .set('Authorization', `Bearer ${accessToken}`);

        result.totalData = {};
        result.totalData.eMonth = totalData.body.generationMonth;
        result.totalData.eTotal = totalData.body.generationUploadTotal;
        result.totalData.eToday = totalData.body.generationValue;

        const today = new Date();
        const dayChart = await superApi.get(`https://webmonitoring-gl.csisolar.com/home/maintain-s/history/power/${plantId}/record?year=${today.getFullYear()}&month=${today.getMonth() + 1}&day=${today.getDate()}`)
            .set('Authorization', `Bearer ${accessToken}`);
        result.chart = {};
        result.chart.pac = [];

        dayChart.body.records.forEach((element: any) => {
            result.chart.pac.push({ x: element.dateTime * 1000, y: element.generationPower });
        });

        result.errorLog = [];

        const getErrorList = await superApi.post('https://webmonitoring-gl.csisolar.com/home/maintain-s/operating/alert/search?order.direction=DESC&order.property=alertTime&page=1&size=20&total=0')
            .send({
                deviceType: '',
                language: 'pt',
                level: '',
                levelList: null,
                plantId: plantId,
                startTime: '',
            }).set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

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

        let getInverterDeviceInfo = await superApi.get(`https://webmonitoring-gl.csisolar.com/home/maintain-s/operating/station/${plantId}/inverter?order.direction=DESC&order.property=name&page=1&size=20&total=0`)
            .set('Authorization', `Bearer ${accessToken}`);

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
        const dataloggInfo = await superApi.get(`https://webmonitoring-gl.csisolar.com/home/maintain-s/operating/station/${plantId}/collector?order.direction=DESC&order.property=name&page=1&size=20&total=1`)
            .set('Authorization', `Bearer ${accessToken}`);

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

export const getCanadianErrorDataListForYear = async (login: string, password: string, year: number, plantId: string) => {
    try {
        let result: Record<string, any> = {};
        result.errorLog = [];

        const hash = crypto.createHash('sha256');
        let hashPassword = hash.update(password, 'utf-8');
        let hashValue = hashPassword.digest('hex');

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

        const dashboard = await superApi.post('https://webmonitoring-gl.csisolar.com/home/oauth-s/oauth/token')
            .send({
                grant_type: 'mdc_password',
                username: login,
                clear_text_pwd: password,
                password: hashValue,
                identity_type: 2,
                client_id: 'test',
                system: 'CSICloud',
            })
            .set('Content-Type', 'application/x-www-form-urlencoded');

        const accessToken = dashboard.body.access_token;

        let compareDate = new Date();
        compareDate.setFullYear(year);

        let getErrorList = await superApi.post('https://webmonitoring-gl.csisolar.com/home/maintain-s/operating/alert/search?order.direction=DESC&order.property=alertTime&page=1&size=40&total=0')
            .send({
                deviceType: '',
                language: 'pt',
                level: '',
                plantId: plantId,
                startTime: '',
            }).set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${accessToken}`);

        let errorLogTemp = getErrorList.body.data;

        errorLogTemp.forEach((element: any) => {
            let newDate = new Date(element.alertTime * 1000);
            if (newDate.getFullYear() === compareDate.getFullYear()) {
                let itemTmp: Record<string, any> = {};
                itemTmp.alias = element.deviceSn;
                itemTmp.deviceType = element.deviceType;
                itemTmp.sn = element.deviceSn;
                itemTmp.time = newDate.toISOString();
                itemTmp.eventName = element.showName;
                itemTmp.eventId = element.addr;
                itemTmp.solution = '-';
                result.errorLog.push(itemTmp);
            }
        });

        return result;
    } catch (error) {
        console.log(error);
        throw new Error('Erro ao consultar dados do erro da planta.');
    }
}

export const getChartCanadianByType = async (login: string, password: string, date: string, type: string, plantId: string) => {
    try {
        let hash = crypto.createHash('sha256');
        let hashPassword = hash.update(password, 'utf-8');
        let hashValue = hashPassword.digest('hex');

        let result: Record<string, any> = {};

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

        const dashboard = await superApi.post('https://webmonitoring-gl.csisolar.com/home/oauth-s/oauth/token')
            .send({
                grant_type: 'mdc_password',
                username: login,
                clear_text_pwd: password,
                password: hashValue,
                identity_type: 2,
                client_id: 'test',
                system: 'CSICloud',
            })
            .set('Content-Type', 'application/x-www-form-urlencoded');

        var acessToken = dashboard.body.access_token;

        result.chart = {};
        if (type === 'time') {
            let newDate = new Date(date);

            let dayChart = await superApi.get(`https://webmonitoring-gl.csisolar.com/home/maintain-s/history/power/${plantId}/record?year=${newDate.getFullYear()}&month=${newDate.getMonth() + 1}&day=${newDate.getDate()}`)
                .set('Authorization', `Bearer ${acessToken}`);

            result.chart.pac = [];
            dayChart.body.records.forEach((element: any) => {
                result.chart.pac.push({ x: element.dateTime * 1000, y: element.generationPower });
            });
        } else if (type === 'day') {
            let newDate = new Date(date);

            let dayChart = await superApi.get(`https://webmonitoring-gl.csisolar.com/home/maintain-s/history/power/${plantId}/stats/month?year=${newDate.getFullYear()}&month=${newDate.getMonth() + 1}`)
                .set('Authorization', `Bearer ${acessToken}`);

            result.chart.energy = [];
            let lastDayOfMouth = lastDayOfMonth(newDate).getDate();
            for (var i = 0; i < lastDayOfMouth; i++) {
                if (dayChart.body.records[i]) {
                    result.chart.energy.push(dayChart.body.records[i].generationValue)
                } else {
                    result.chart.energy.push(0);
                }
            }
        } else if (type === 'mouth') {
            let dayChart = await superApi.get(`https://webmonitoring-gl.csisolar.com/home/maintain-s/history/power/${plantId}/stats/year?year=${date}`)
                .set('Authorization', `Bearer ${acessToken}`);

            result.chart.energy = [];

            for (var i = 0; i < 12; i++) {
                if (dayChart.body.records[i]) {
                    result.chart.energy[dayChart.body.records[i].month - 1] = dayChart.body.records[i].generationValue;
                } if (result.chart.energy[i] === undefined) {
                    result.chart.energy[i] = 0;
                }
            }
        } else if (type === 'year') {
            let dayChart = await superApi.get(`https://webmonitoring-gl.csisolar.com/home/maintain-s/history/power/${plantId}/stats/total`)
                .set('Authorization', `Bearer ${acessToken}`);

            result.chart.energy = [];
            let temp: any = []
            
            dayChart.body.records.forEach((element: any) => {
                temp.push({ x: element.year, y: element.generationValue });
            });
            temp.sort((a: any, b: any) => a.x - b.x);

            temp.forEach((element: any) => {
                result.chart.energy.push(element.y);
            });
        }

        return result;
    } catch (error) {
        console.log(error);
        throw new Error('Erro ao consultar dados de geração da planta.');
    }
}