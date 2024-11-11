import superagent from "superagent";
import growatt from 'growatt';
import getCurrentDateInBrazil from "./getCurrentDateInBrazil";

const cookie = require('superagent-cookie');
const superApi = superagent.agent();

const lastDay = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
}

const verifyLoginType = async (login: string, password: string): Promise<boolean> => {
    const growattApi = new growatt({});
    const { result } = await growattApi.login(login, password);

    if (result !== 1) throw new Error('Erro no login');

    const plantData = await growattApi.getAllPlantData();

    if (Object.keys(plantData).length === 0) {
        await growattApi.logout();
        return false;
    } else {
        await growattApi.logout();
        return true;
    }

}

export const fetchGrowattData = async (login: string, password: string) => {
    try {
        let result: Record<string, any> = {};

        if (await verifyLoginType(login, password)) {
            let headers: Record<string, any> = {};
            let loginDashboard = await superApi.post('https://server.growatt.com/login').send({
                account: login,
                password: password
            }).set('Content-Type', 'application/x-www-form-urlencoded')
                .timeout({
                    response: 10000,
                }).then((res) => {
                    cookie.save(res.headers['set-cookie'], 'growattCookies');
                    headers = {
                        'cookie': cookie.use('growattCookies')
                    }
                });

            let plantList = await superApi.post('https://server.growatt.com/index/getPlantListTitle')
                .send()
                .set('Content-Type', 'text/html')
                .set(headers)
                .timeout({
                    response: 10000,
                });

            let temp = JSON.parse(plantList.text)[0].id;

            let getWeatherInfo = await superApi.post(`https://server.growatt.com/index/getWeatherByPlantId?plantId=${temp}`)
                .send()
                .set('Content-Type', 'text/html')
                .set(headers)
                .timeout({
                    response: 10000,
                });
            result.weather = JSON.parse(getWeatherInfo.text).obj.data.HeWeather6[0];

            let getPlantData = await superApi.post(`https://server.growatt.com/panel/getPlantData?plantId=${temp}`)
                .send()
                .set('Content-Type', 'text/html')
                .set(headers)
                .timeout({
                    response: 10000,
                });
            result.plantData = JSON.parse(getPlantData.text).obj;

            let getInverterDevice = await superApi.post('https://server.growatt.com/panel/getDevicesByPlantList')
                .send({ plantId: temp, currPage: 1 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .set(headers)
                .timeout({
                    response: 10000,
                });
            result.deviceSN = JSON.parse(getInverterDevice.text).obj.datas[0];

            let getTotalData = await superApi.post('https://server.growatt.com/device/getPlantTotalData')
                .send({ plantId: temp, })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .set(headers)
                .timeout({
                    response: 10000,
                });
            result.totalData = JSON.parse(getTotalData.text).obj;

            let deviceTypeName = result.deviceSN.deviceTypeName;
            let getInverterDeviceInfo = await superApi.post('https://server.growatt.com/panel/getDeviceInfo')
                .send({
                    plantId: temp,
                    deviceTypeName: deviceTypeName,
                    sn: result.deviceSN.alias,
                }).set('Content-Type', 'application/x-www-form-urlencoded')
                .set(headers)
                .timeout({
                    response: 10000,
                });
            result.deviceSNInfo = JSON.parse(getInverterDeviceInfo.text).obj;

            let getDatalogDeviceInfo = await superApi.post('https://server.growatt.com/panel/getDeviceInfo')
                .send({
                    plantId: temp,
                    deviceTypeName: 'datalog',
                    sn: result.deviceSN.datalogSn,
                }).set('Content-Type', 'application/x-www-form-urlencoded')
                .set(headers)
                .timeout({
                    response: 10000,
                });
            result.datalogSNInfo = JSON.parse(getDatalogDeviceInfo.text).obj;

            let today = new Date().toISOString().slice(0, 10);
            if (deviceTypeName === 'tlx') {
                let dayChart = await superApi.post('https://server.growatt.com/panel/tlx/getTLXEnergyDayChart')
                    .send({
                        date: today,
                        plantId: temp,
                        tlxSn: result.deviceSN.alias,
                    }).set('Content-Type', 'application/x-www-form-urlencoded')
                    .set(headers)
                    .timeout({
                        response: 10000,
                    });
                result.chart = JSON.parse(dayChart.text).obj;
            } else if (deviceTypeName === 'max') {
                let dayChart = await superApi.post('https://server.growatt.com/panel/max/getMAXDayChart')
                    .send({
                        date: today,
                        plantId: temp,
                    }).set('Content-Type', 'application/x-www-form-urlencoded')
                    .set(headers)
                    .timeout({
                        response: 10000,
                    });
                result.chart = JSON.parse(dayChart.text).obj;
            }

            let getDataErrorLog = await superApi.post('https://server.growatt.com/log/getNewPlantFaultLog')
                .send({
                    deviceSn: '',
                    date: new Date().getFullYear(),
                    plantId: temp,
                    toPageNum: 1,
                    type: 3
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .set(headers)
                .timeout({
                    response: 10000,
                });
            result.errorLog = JSON.parse(getDataErrorLog.text).obj.datas;

            let logoult = await superApi.get('https://server.growatt.com/logout');
        } else {
            let temp = '';
            let temp02 = '';
            let headers: Record<string, any> = {};
            result.deviceSNInfo = {};

            await superApi.post('https://server.growatt.com/login')
                .send({
                    account: login,
                    password: password,
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .then(async (res) => {
                    cookie.save(res.headers['set-cookie'], 'growattCookies');
                    headers = {
                        'cookie': cookie.use('growattCookies')
                    }
                    await superApi.get('http://server.growatt.com/indexbC/getPlantListTitle')
                        .set(headers)
                        .then(async (res) => {
                            try {
                                temp = JSON.parse(res.text)[0].id;
                                temp02 = JSON.parse(res.text)[0].plantName;
                            } catch (e) {
                                console.error(e);
                            }
                            result.plantData = {};
                            result.plantData.id = temp;
                            await superApi.post('http://server.growatt.com/indexbC/getWeatherByPlantId')
                                .send({ plantId: temp })
                                .set('Content-Type', 'application/x-www-form-urlencoded')
                                .set(headers)
                                .then((res) => {
                                    try {
                                        result.weather = JSON.parse(res.text).obj.data.HeWeather6[0];
                                    } catch (e) {
                                        console.error(e);
                                    }
                                });
                            await superApi.post('http://server.growatt.com/indexbC/getTotalData')
                                .send({ plantId: temp, })
                                .set('Content-Type', 'application/x-www-form-urlencoded')
                                .set(headers)
                                .then((res) => {
                                    try {
                                        result.totalData = JSON.parse(res.text).obj;
                                    } catch (e) {
                                        console.error(e);
                                    }
                                });
                            await superApi.post('http://server.growatt.com/plantbC/plantDevice/getInvs')
                                .send({
                                    currPage: 1,
                                    pageSize: 10,
                                    plantId: temp
                                })
                                .set('Content-Type', 'application/x-www-form-urlencoded')
                                .set(headers)
                                .then(async (res) => {
                                    try {
                                        result.deviceSN = JSON.parse(res.text).obj.datas[0];
                                        result.deviceSN.plantName = temp02;
                                        await superApi.post('http://server.growatt.com/plantbC/plantDevice/getDatalogList')
                                            .send({
                                                currPage: 1,
                                                pageSize: 10,
                                                plantId: temp
                                            })
                                            .set('Content-Type', 'application/x-www-form-urlencoded')
                                            .set(headers)
                                            .then((res) => {
                                                try {
                                                    result.datalogSNInfo = JSON.parse(res.text).obj.datas[0];
                                                    result.deviceSNInfo.deviceModel = result.deviceSN.deviceTypeName;
                                                    result.deviceSNInfo.fwVersion = result.datalogSNInfo.firmwareVersion;
                                                    result.deviceSNInfo.communicationVersion = result.deviceSN.deviceType;
                                                    result.deviceSNInfo.innerVersion = '-';
                                                    result.deviceSNInfo.modelText = result.deviceSN.deviceModel;
                                                } catch (e) {
                                                    console.error(e);
                                                }
                                            });
                                    } catch (e) {
                                        console.error(e);
                                    }
                                });
                            let today = new Date().toISOString().slice(0, 10);
                            await superApi.post('http://server.growatt.com/indexbC/inv/getInvEnergyDayChart')
                                .send({
                                    date: today,
                                    plantId: temp,
                                })
                                .set('Content-Type', 'application/x-www-form-urlencoded')
                                .set(headers)
                                .then((res) => {
                                    try {
                                        result.chart = JSON.parse(res.text).obj;
                                    } catch (e) {
                                        console.error(e);
                                    }
                                });
                            let starterDate = new Date();
                            let endDate = new Date();
                            result.errorLog = [];
                            for (var mouth = starterDate.getMonth(); mouth >= 0; mouth--) {

                                starterDate.setDate(1);
                                starterDate.setMonth(mouth);
                                endDate.setDate(lastDay(endDate.getFullYear(), endDate.getMonth()) - 1);
                                endDate.setMonth(mouth);

                                await superApi.post('http://server.growatt.com/ombC/errors/getErrors')
                                    .send({
                                        currPage: 1,
                                        pageSize: 10,
                                        plantId: temp,
                                        level: -1,
                                        start: starterDate.toISOString().slice(0, 10),
                                        end: endDate.toISOString().slice(0, 10),
                                        sn: '',
                                    })
                                    .set('Content-Type', 'application/x-www-form-urlencoded')
                                    .set(headers)
                                    .then((res) => {
                                        try {
                                            let errorTemp = JSON.parse(res.text).obj.datas;

                                            for (let index = 0; index < errorTemp.length; index++) {
                                                if (errorTemp[index]) {
                                                    let itemTmp: Record<string, any> = {};
                                                    itemTmp.alias = errorTemp[index].deviceSn;
                                                    itemTmp.deviceType = errorTemp[index].deviceModel;
                                                    itemTmp.sn = errorTemp[index].deviceSn;
                                                    itemTmp.time = errorTemp[index].time;
                                                    itemTmp.eventName = errorTemp[index].eventName;
                                                    itemTmp.eventId = errorTemp[index].event_id;
                                                    itemTmp.solution = errorTemp[index].eventSolution;
                                                    result.errorLog.push(itemTmp);
                                                }
                                            }
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    });
                            }
                        });
                });
            let logoult = await superApi.get('https://server.growatt.com/logout');
        }
        return result;
    } catch (error) {
        console.log(error);
        throw new Error('Erro ao consultar dados individuais da planta solar.');
    }
}

export const getErrorDataListForYear = async (login: string, password: string, year: number, plantId: string) => {
    try {
        let result: Record<string, any> = {};
        result.errorLog = [];

        if (await verifyLoginType(login, password)) {
            let dashboard = await superApi.post('https://server.growatt.com/login').send({
                account: login,
                password: password,
            }).set('Content-Type', 'application/x-www-form-urlencoded');

            let getDataErrorLog = await superApi.post('https://server.growatt.com/log/getNewPlantFaultLog')
                .send({
                    deviceSn: '',
                    date: year,
                    plantId: plantId,
                    toPageNum: 1,
                    type: 3
                })
                .set('Content-Type', 'application/x-www-form-urlencoded');
            result.errorLog = JSON.parse(getDataErrorLog.text).obj.datas;
        } else {
            let dashboard = await superApi.post('https://server.growatt.com/login').send({
                account: login,
                password: password
            }).set('Content-Type', 'application/x-www-form-urlencoded');

            let starterDate = new Date();
            starterDate.setMonth(11);
            starterDate.setFullYear(year);

            let endDate = new Date();
            endDate.setMonth(11);
            endDate.setFullYear(year);

            for (var mouth = starterDate.getMonth(); mouth >= 0; mouth--) {
                starterDate.setDate(1);
                starterDate.setMonth(mouth);
                endDate.setDate(lastDay(endDate.getFullYear(), endDate.getMonth()) - 1);
                endDate.setMonth(mouth);

                let getErrorLog = await superApi.post('http://server.growatt.com/ombC/errors/getErrors').send({
                    currPage: 1,
                    pageSize: 10,
                    plantId: plantId,
                    level: -1,
                    start: starterDate.toISOString().slice(0, 10),
                    end: endDate.toISOString().slice(0, 10),
                    sn: '',
                }).set('Content-Type', 'application/x-www-form-urlencoded');

                let errorTemp = JSON.parse(getErrorLog.text).obj.datas;

                errorTemp.forEach((element: Record<string, any>) => {
                    if (element) {
                        let itemTmp: Record<string, any> = {};
                        itemTmp.alias = element.deviceSn;
                        itemTmp.deviceType = element.deviceModel;
                        itemTmp.sn = element.deviceSn;
                        itemTmp.time = element.time;
                        itemTmp.eventName = element.eventName;
                        itemTmp.eventId = element.event_id;
                        itemTmp.solution = element.eventSolution;
                        result.errorLog.push(itemTmp);
                    }
                });
            }
        }

        let logoult = await superApi.get('https://server.growatt.com/logout');

        return result;
    } catch (error) {
        console.log(error);
        throw new Error('Erro ao consultar dados do erro da planta.');
    }
}

export const getChartByType = async (login: string, password: string, date: string, type: string, plantId: string, deviceTypeName: string, deviceSN: string) => {
    try {
        let result: Record<string, any> = {};
        let chart: superagent.Response | undefined;

        if (await verifyLoginType(login, password)) {
            let headers: Record<string, any> = {};
            let loginDashboard = await superApi.post('https://server.growatt.com/login').send({
                account: login,
                password: password
            }).set('Content-Type', 'application/x-www-form-urlencoded')
                .timeout({
                    response: 10000,
                }).then((res) => {
                    cookie.save(res.headers['set-cookie'], 'growattCookies');
                    headers = {
                        'cookie': cookie.use('growattCookies')
                    }
                });

            if (type === 'time') {
                if (deviceTypeName === 'tlx') {
                    chart = await superApi.post('https://server.growatt.com/panel/tlx/getTLXEnergyDayChart')
                        .send({
                            date: date,
                            plantId: plantId,
                            tlxSn: deviceSN,
                        }).set('Content-Type', 'application/x-www-form-urlencoded');
                } else if (deviceTypeName === 'max') {
                    chart = await superApi.post('https://server.growatt.com/panel/max/getMAXDayChart')
                        .send({
                            date: date,
                            plantId: plantId,
                        }).set('Content-Type', 'application/x-www-form-urlencoded');
                }
            } else if (type === 'day') {
                if (deviceTypeName === 'tlx') {
                    chart = await superApi.post('https://server.growatt.com/panel/tlx/getTLXEnergyMonthChart')
                        .send({
                            date: date,
                            plantId: plantId,
                            tlxSn: deviceSN,
                        }).set('Content-Type', 'application/x-www-form-urlencoded');

                } else if (deviceTypeName === 'max') {
                    chart = await superApi.post('https://server.growatt.com/panel/max/getMAXMonthChart')
                        .send({
                            date: date,
                            plantId: plantId,
                        }).set('Content-Type', 'application/x-www-form-urlencoded');
                }
            } else if (type === 'mouth') {
                if (deviceTypeName === 'tlx') {
                    chart = await superApi.post('https://server.growatt.com/panel/tlx/getTLXEnergyYearChart')
                        .send({
                            year: date,
                            plantId: plantId,
                            tlxSn: deviceSN,
                        }).set('Content-Type', 'application/x-www-form-urlencoded');
                } else if (deviceTypeName === 'max') {
                    chart = await superApi.post('https://server.growatt.com/panel/max/getMAXYearChart')
                        .send({
                            year: date,
                            plantId: plantId,
                        }).set('Content-Type', 'application/x-www-form-urlencoded');
                }
            } else if (type === 'year') {
                let temp = new Date().getFullYear();
                if (deviceTypeName === 'tlx') {
                    chart = await superApi.post('https://server.growatt.com/panel/tlx/getTLXEnergyTotalChart')
                        .send({
                            year: temp,
                            plantId: plantId,
                            tlxSn: deviceSN,
                        }).set('Content-Type', 'application/x-www-form-urlencoded');
                } else if (deviceTypeName === 'max') {
                    chart = await superApi.post('https://server.growatt.com/panel/max/getMAXTotalChart')
                        .send({
                            year: date,
                            plantId: plantId,
                        }).set('Content-Type', 'application/x-www-form-urlencoded');
                }
            }

            if (chart) {
                result.chart = JSON.parse(chart.text).obj;
            }
        } else {
            let headers: Record<string, any> = {};
            let loginDashboard = await superApi.post('https://server.growatt.com/login').send({
                account: login,
                password: password
            }).set('Content-Type', 'application/x-www-form-urlencoded')
                .timeout({
                    response: 10000,
                }).then((res) => {
                    cookie.save(res.headers['set-cookie'], 'growattCookies');
                    headers = {
                        'cookie': cookie.use('growattCookies')
                    }
                });

            if (type === 'time') {
                chart = await superApi.post('http://server.growatt.com/indexbC/inv/getInvEnergyDayChart').send({
                    plantId: plantId,
                    date: date
                }).set('Content-Type', 'application/x-www-form-urlencoded');
            } else if (type === 'day') {
                chart = await superApi.post('http://server.growatt.com/indexbC/inv/getInvEnergyMonthChart').send({
                    plantId: plantId,
                    date: date
                }).set('Content-Type', 'application/x-www-form-urlencoded');
            } else if (type === 'mouth') {
                chart = await superApi.post('http://server.growatt.com/indexbC/inv/getInvEnergyYearChart').send({
                    plantId: plantId,
                    date: date
                }).set('Content-Type', 'application/x-www-form-urlencoded');
            } else if (type === 'year') {
                let today = new Date().getFullYear();
                chart = await superApi.post('http://server.growatt.com/indexbC/inv/getInvEnergyTotalChart').send({
                    plantId: plantId,
                    date: today
                }).set('Content-Type', 'application/x-www-form-urlencoded');
            }

            if (chart) {
                result.chart = JSON.parse(chart.text).obj;
            }
        }

        return result;
    } catch (error) {
        console.log(error);
        throw new Error('Erro ao consultar dados de geração da planta.');
    }
}