import superagent from 'superagent';

interface ChartElement {
    x: string;
    y: number;
    z: number | null;
}

export const fetchGoodweData = async (login: string, password: string) => {
    const superApiInstance = superagent.agent();
    try {
        let result: Record<string, any> = {};

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

        result.plantData = {};
        const powerStationId = stationRes.body.data;

        if (!powerStationId) {
            throw new Error(`Falha ao obter o ID da usina para login ${login}. Resposta da API: ${JSON.stringify(stationRes.body)}`);
        }

        result.plantData.id = powerStationId;

        result.totalData = {};

        const plantDetailRes = await superApiInstance
            .post('https://us.semsportal.com/api/v3/PowerStation/GetPlantDetailByPowerstationId')
            .set('Content-Type', 'application/json')
            .set('token', tokenHeader)
            .send({ powerStationId });

        if (!plantDetailRes.body?.data?.kpi) {
            throw new Error(`Dados KPI ausentes para a usina ${powerStationId}.`);
        } else {
            result.totalData.eToday = plantDetailRes.body.data.kpi.power;
            result.totalData.eMonth = plantDetailRes.body.data.kpi.month_generation;
            result.totalData.eTotal = plantDetailRes.body.data.kpi.total_power;
        }

        const plantWeatherRes = await superApiInstance
            .post('https://us.semsportal.com/api/v3/PowerStation/GetWeather')
            .set('Content-Type', 'application/json')
            .set('token', tokenHeader)
            .send({ powerStationId });

        result.weather = { now: {}, basic: {} };

        if (plantWeatherRes.body?.data?.weather?.HeWeather6?.[0]?.daily_forecast?.[0]) {
            result.weather.now.tmp = plantWeatherRes.body.data.weather.HeWeather6[0].daily_forecast[0].tmp_max;
            result.weather.now.cond_txt = plantWeatherRes.body.data.weather.HeWeather6[0].daily_forecast[0].cond_txt_d;
        } else {
            result.weather.now.tmp = '-';
            result.weather.now.cond_txt = '-';
        }

        result.weather.basic.sr = '-';
        result.weather.basic.ss = '-';

        if (!plantDetailRes.body?.data?.info) {
            result.weather.basic.location = 'N/A';
        } else {
            result.weather.basic.location = plantDetailRes.body.data.info.address;
        }
        result.weather.basic.admin_area = '';

        const plantAmbientalRes = await superApiInstance
            .post('https://us.semsportal.com/api/BigScreen/GetPowerStationTotalDataByOwnerOncePw')
            .set('Content-Type', 'application/json')
            .set('token', tokenHeader)
            .send({ id: powerStationId });

        if (plantAmbientalRes.body?.data) {
            result.plantData.tree = plantAmbientalRes.body.data.tree;
            result.plantData.co2 = plantAmbientalRes.body.data.co2;
        } else {
            result.plantData.tree = 0;
            result.plantData.co2 = 0;
        }

        const plantChartRes = await superApiInstance
            .post('https://us.semsportal.com/api/v2/Charts/GetPlantPowerChart')
            .set('Content-Type', 'application/json')
            .set('token', tokenHeader)
            .send({
                date: new Date().toISOString().split('T')[0],
                full_script: false,
                id: powerStationId
            });

        result.chart = {};
        result.chart.pac = [];

        let temp = plantChartRes.body?.data?.lines?.[0]?.xy;
        if (temp) {
            temp.forEach((element: ChartElement) => {
                result.chart.pac.push(element.y);
            });
        } else {
            result.chart.pac = [];
        }

        const plantErrorRes = await superApiInstance
            .post('https://us.semsportal.com/api/warning/PowerstationWarningsQuery')
            .set('Content-Type', 'application/json')
            .set('token', tokenHeader)
            .send({ pw_id: powerStationId });

        if (plantErrorRes.body?.data?.list?.[0]?.warning) {
            result.errorLog = plantErrorRes.body.data.list[0].warning;
        } else {
            result.errorLog = [];
        }

        const plantInverterInfoRes = await superApiInstance
            .post('https://us.semsportal.com/api/v3/PowerStation/GetInverterAllPoint')
            .set('Content-Type', 'application/json')
            .set('token', tokenHeader)
            .send({ powerStationId });

        result.deviceSN = {};
        if (plantInverterInfoRes.body?.data?.inverterPoints?.[0]?.sn) {
            result.deviceSN.alias = plantInverterInfoRes.body.data.inverterPoints[0].sn;
        } else {
            result.deviceSN.alias = 'N/A';
        }

        if (plantDetailRes.body?.data?.info) {
            result.deviceSN.status = plantDetailRes.body.data.info.status.toString();
            result.deviceSN.plantName = plantDetailRes.body.data.info.stationname;
            result.deviceSN.lastUpdateTime = plantDetailRes.body.data.info.time;
        } else {
            result.deviceSN.status = 'N/A';
            result.deviceSN.plantName = 'N/A';
            result.deviceSN.lastUpdateTime = 'N/A';
        }
        if (plantDetailRes.body?.data?.kpi) {
            result.deviceSN.pac = plantDetailRes.body.data.kpi.pac;
        } else {
            result.deviceSN.pac = 0;
        }

        if (plantInverterInfoRes.body?.data?.inverterPoints?.[0]?.dict?.left?.[3]?.value) {
            result.deviceSN.nominalPower = plantInverterInfoRes.body.data.inverterPoints[0].dict.left[3].value;
        } else {
            result.deviceSN.nominalPower = 'N/A';
        }
        result.deviceSN.deviceTypeName = 'max';

        result.deviceSNInfo = {};
        if (plantInverterInfoRes.body?.data?.inverterPoints?.[0]?.dict?.left?.[0]?.value) {
            result.deviceSNInfo.deviceModel = plantInverterInfoRes.body.data.inverterPoints[0].dict.left[0].value;
        } else {
            result.deviceSNInfo.deviceModel = 'N/A';
        }
        result.deviceSNInfo.fwVersion = '-';
        result.deviceSNInfo.communicationVersion = '-';
        result.deviceSNInfo.innerVersion = '-';
        result.deviceSNInfo.modelText = '-';

        result.datalogSNInfo = {};
        result.datalogSNInfo.simSignal = '-';
        result.datalogSNInfo.deviceType = '-';
        result.datalogSNInfo.firmwareVersion = '-';
        result.datalogSNInfo.ipAndPort = '-';
        result.datalogSNInfo.interval = 5;

        await superApiInstance
            .post('https://www.semsportal.com/home/logout');

        await superApiInstance
            .post('https://us.semsportal.com/api/Auth/RemoveToken')
            .set('token', tokenHeader)
            .send({ tokenHeader });

        return result;

    } catch (error: any) {
        throw new Error(`Erro ao consultar dados da usina para ${login}. Detalhe: ${error.message}`);
    }
}

export const getGoodweErrorDataListForYear = async (login: string, password: string, year: number, plantId: string) => {
    const superApiInstance = superagent.agent();
    try {
        let result: Record<string, any> = { errorLog: [] };

        const loginRes = await superApiInstance
            .post('https://www.semsportal.com/api/v1/Common/CrossLogin')
            .set('Content-Type', 'application/json')
            .set('Token', JSON.stringify({ version: 'v2.1.0', client: 'ios', language: 'en' }))
            .send({ account: login, pwd: password });

        const loginData = loginRes.body.data;
        if (!loginData?.token || !loginData?.uid || !loginData?.timestamp) {
            throw new Error(`Dados incompletos no login para ${login} (em getGoodweErrorDataListForYear).`);
        }

        const tokenHeader = JSON.stringify({
            uid: loginData.uid,
            timestamp: loginData.timestamp,
            token: loginData.token,
            client: 'ios',
            version: 'v2.1.0',
            language: 'pt-pt'
        });

        const plantErrorRes = await superApiInstance
            .post('https://us.semsportal.com/api/warning/PowerstationWarningsQuery')
            .set('Content-Type', 'application/json')
            .set('token', tokenHeader)
            .send({ pw_id: plantId });

        if (plantErrorRes.body?.data?.list?.[0]?.warning) {
            result.errorLog = plantErrorRes.body.data.list[0].warning;
        } else {
            result.errorLog = [];
        }

        await superApiInstance.post('https://www.semsportal.com/home/logout');
        await superApiInstance.post('https://us.semsportal.com/api/Auth/RemoveToken')
            .set('token', tokenHeader)
            .send({ tokenHeader });

        return result;
    } catch (error: any) {
        throw new Error(`Erro ao consultar dados de erro da usina para ${login}. Detalhe: ${error.message}`);
    }
}

export const getChartGoodweByType = async (login: string, password: string, date: string, type: string, plantId: string) => {
    const superApiInstance = superagent.agent();
    try {
        let result: Record<string, any> = {};

        const loginRes = await superApiInstance
            .post('https://www.semsportal.com/api/v1/Common/CrossLogin')
            .set('Content-Type', 'application/json')
            .set('Token', JSON.stringify({ version: 'v2.1.0', client: 'ios', language: 'en' }))
            .send({ account: login, pwd: password });

        const loginData = loginRes.body.data;
        if (!loginData?.token || !loginData?.uid || !loginData?.timestamp) {
            throw new Error(`Dados incompletos no login para ${login} (em getChartGoodweByType).`);
        }

        const tokenHeader = JSON.stringify({
            uid: loginData.uid,
            timestamp: loginData.timestamp,
            token: loginData.token,
            client: 'ios',
            version: 'v2.1.0',
            language: 'pt-pt'
        });

        let plantChartRes;
        result.chart = {};

        if (type === 'time') {
            plantChartRes = await superApiInstance
                .post('https://us.semsportal.com/api/v2/Charts/GetPlantPowerChart')
                .set('Content-Type', 'application/json')
                .set('token', tokenHeader)
                .send({
                    date: new Date(date).toISOString().split('T')[0],
                    full_script: false,
                    id: plantId
                });

            let temp = plantChartRes.body?.data?.lines?.[0]?.xy;
            result.chart.pac = [];

            if (temp) {
                temp.forEach((element: ChartElement) => {
                    result.chart.pac.push(element.y);
                });
            } else {
                result.chart.pac = [];
            }

        } else if (type === 'day') {
            const initialDate = new Date(date);
            const year = initialDate.getFullYear();
            const month = initialDate.getMonth();

            const requestDate = new Date(year, month + 1, 0);

            plantChartRes = await superApiInstance
                .post('https://us.semsportal.com/api/v2/Charts/GetChartByPlant')
                .set('Content-Type', 'application/json')
                .set('token', tokenHeader)
                .send({
                    chartIndexId: "3",
                    date: requestDate.toISOString().split('T')[0],
                    id: plantId,
                    isDetailFull: "",
                    range: "2"
                });

            const targetYear = requestDate.getFullYear();
            const targetMonth = requestDate.getMonth() + 1;
            result.chart.energy = [];

            if (plantChartRes.body?.data?.lines?.[0]?.xy) {
                let tempChart: ChartElement[] = plantChartRes.body.data.lines[0].xy;
                tempChart.forEach((element: ChartElement) => {
                    const [elementYearStr, elementMonthStr] = element.x.split('-');
                    const elementYear = parseInt(elementYearStr);
                    const elementMonth = parseInt(elementMonthStr);
                    if (elementYear === targetYear && elementMonth === targetMonth) {
                        result.chart.energy.push(element.y);
                    }
                });
            } else {
                console.warn(`[getChartGoodweByType WARN] Data lines (day) are not available for ${plantId}.`);
            }
        } else if (type === 'mouth') {
            const requestMainDate = new Date();
            requestMainDate.setFullYear(parseInt(date));
            plantChartRes = await superApiInstance
                .post('https://us.semsportal.com/api/v2/Charts/GetChartByPlant')
                .set('Content-Type', 'application/json')
                .set('token', tokenHeader)
                .send({
                    chartIndexId: "3",
                    date: requestMainDate.toISOString().split('T')[0],
                    id: plantId,
                    isDetailFull: "",
                    range: "3"
                });

            const targetYear = requestMainDate.getFullYear();
            result.chart.energy = new Array(12).fill(0);

            if (plantChartRes.body?.data?.lines?.[0]?.xy) {
                const monthlyDataFromApi: ChartElement[] = plantChartRes.body.data.lines[0].xy;
                monthlyDataFromApi.forEach((element: ChartElement) => {
                    const [elementYearStr, elementMonthStr] = element.x.split('-');
                    const elementYear = parseInt(elementYearStr);
                    const elementMonth = parseInt(elementMonthStr);
                    if (elementYear === targetYear && elementMonth >= 1 && elementMonth <= 12) {
                        result.chart.energy[elementMonth - 1] = element.y;
                    }
                });
            } else {
                console.warn(`[getChartGoodweByType WARN] Data lines (month) or xy data are not available for ${plantId}.`);
            }
        } else if (type === 'year') {
            plantChartRes = await superApiInstance
                .post('https://us.semsportal.com/api/v2/Charts/GetChartByPlant')
                .set('Content-Type', 'application/json')
                .set('token', tokenHeader)
                .send({
                    chartIndexId: "3",
                    date: new Date().toISOString().split('T')[0],
                    id: plantId,
                    isDetailFull: "",
                    range: "4"
                });

            result.chart.energy = [];
            if (plantChartRes.body?.data?.lines?.[0]?.xy) {
                plantChartRes.body.data.lines[0].xy.forEach((element: ChartElement) => {
                    if (element.y > 0) {
                        result.chart.energy.push(element.y);
                    }
                });
            } else {
                console.warn(`[getChartGoodweByType WARN] Data lines (year) or xy data are not available for ${plantId}.`);
            }
        }

        await superApiInstance.post('https://www.semsportal.com/home/logout');
        await superApiInstance.post('https://us.semsportal.com/api/Auth/RemoveToken')
            .set('token', tokenHeader)
            .send({ tokenHeader });

        return result;
    } catch (error: any) {
        throw new Error(`Erro ao consultar dados de geração da usina para ${login}. Detalhe: ${error.message}`);
    }
}