import { scrappingSolisData, scrappingSolisErroData } from "../Api/WebScrapping/solisWebScrapping";

export const fetchSolisData = async (username: string, password: string) => {

    let result: Record<string, any> = {};
    const scrappingData = await scrappingSolisData(username, password);

    const stationListResult = scrappingData.find(item => item.url.includes('/station/list'));
    const detailMixResult = scrappingData.find(item => item.url.includes('/station/detailMix'));
    const stationDayChartResult = scrappingData.find(item => item.url.includes('/chart/station/day/v2'));
    const alarmListResult = scrappingData.find(item => item.url.includes('/alarm/list'));
    const collectorListResult = scrappingData.find(item => item.url.includes('/collector/listV2'));
    const inverterListResult = scrappingData.find(item => item.url.includes('/inverter/listV2'));

    const stationListData = stationListResult?.data?.data;
    const detailMixData = detailMixResult?.data?.data;
    const stationDayChartData = stationDayChartResult?.data?.data;
    const alarmListData = alarmListResult?.data?.data;
    const collectorListData = collectorListResult?.data?.data;
    const inverterListData = inverterListResult?.data?.data;

    result.plantData = {};

    result.plantData.id = stationListData?.page?.records?.[0]?.id;

    result.weather = {};
    result.weather.now = {};
    result.weather.basic = {};

    result.weather.now.cond_txt = stationListData?.page?.records?.[0]?.condTxtD;
    result.weather.now.tmp = detailMixData.tmpMax;
    result.weather.basic.sr = detailMixData.sr;
    result.weather.basic.ss = detailMixData.ss;

    result.weather.basic.location = detailMixData.regionShortName;
    result.weather.basic.admin_area = detailMixData.addr;

    result.totalData = {};
    result.totalData.eMonth = detailMixData.monthEnergy;
    result.totalData.eTotal = detailMixData.allEnergy1;
    result.totalData.eToday = detailMixData.dayEnergy;

    result.deviceSN = {};
    result.deviceSN.alias = stationListData.page?.records?.[0]?.id;
    result.deviceSN.status = stationListData.page?.records?.[0]?.state.toString();
    result.deviceSN.plantName = stationListData.page?.records?.[0]?.stationName;
    result.deviceSN.lastUpdateTime = stationListData.page?.records?.[0]?.dataTimestampStr;
    result.deviceSN.datalogSn = inverterListData.page?.records?.[0]?.collectorSn;
    result.deviceSN.nominalPower = stationListData.page?.records?.[0]?.capacity;
    result.deviceSN.pac = stationListData.page?.records?.[0]?.power;
    result.deviceSN.deviceTypeName = 'max';

    result.deviceSNInfo = {};
    result.deviceSNInfo.deviceModel = inverterListData.page?.records?.[0]?.model;
    result.deviceSNInfo.fwVersion = inverterListData.page?.records?.[0]?.inverterSoftwareVersion;
    result.deviceSNInfo.communicationVersion = collectorListData.page?.records?.[0]?.monitorModel;
    result.deviceSNInfo.innerVersion = inverterListData.page?.records?.[0]?.inverterSoftwareVersion2;
    result.deviceSNInfo.modelText = inverterListData.page?.records?.[0]?.productModel;

    result.datalogSNInfo = {};
    result.datalogSNInfo.simSignal = collectorListData.page?.records?.[0]?.rssi;
    result.datalogSNInfo.deviceType = collectorListData.page?.records?.[0]?.model;
    result.datalogSNInfo.firmwareVersion = collectorListData.page?.records?.[0]?.version;
    result.datalogSNInfo.ipAndPort = 'sem informação';
    result.datalogSNInfo.interval = 5;

    result.chart = {
        pac: []
    };

    if (
        stationDayChartData?.power &&
        stationDayChartData?.time &&
        stationDayChartData.power.length === stationDayChartData.time.length
    ) {
        result.chart.pac = stationDayChartData.power.map((powerValue: number, index: number) => {
            const timestamp = stationDayChartData.time[index];
            return {
                x: timestamp,
                y: powerValue
            };
        });

    } else {
        console.warn('⚠️ Dados do gráfico (power/time) estão ausentes ou com tamanhos diferentes. Pulando o processamento do gráfico.');
    }

    result.errorLog = [];

    let errorLogTemp = alarmListData.records;
    errorLogTemp.forEach((element: any) => {
        let date = new Date(element.alarmBeginTime);
        if (date.getFullYear() === new Date().getFullYear()) {
            let itemTmp: Record<string, any> = {};
            itemTmp.alias = element.alarmDeviceSn;
            itemTmp.deviceType = 'Inverter';
            itemTmp.sn = element.alarmDeviceSn;
            itemTmp.time = element.alarmBeginTimeStr;
            itemTmp.eventName = element.alarmMsg;
            itemTmp.eventId = element.alarmCode;
            itemTmp.solution = element.advice;
            result.errorLog.push(itemTmp);
        }
    });

    return result;
};

export const getSolisErroListLog = async (username: string, password: string, plantId: string, year: number) => {
    try {
        let result: Record<string, any> = {};

        const scrappingData = await scrappingSolisErroData(username, password, plantId);

        const alarmListResult = scrappingData.find(item => item.url.includes('/alarm/list'));

        const alarmListData = alarmListResult?.data?.data;

        result.errorLog = [];

        let compareDate = new Date();
        compareDate.setFullYear(year);

        let errorLogTemp = alarmListData.records;
        errorLogTemp.forEach((element: any) => {
            let date = new Date(element.alarmBeginTime);
            if (date.getFullYear() === compareDate.getFullYear()) {
                let itemTmp: Record<string, any> = {};
                itemTmp.alias = element.alarmDeviceSn;
                itemTmp.deviceType = 'Inverter';
                itemTmp.sn = element.alarmDeviceSn;
                itemTmp.time = element.alarmBeginTimeStr;
                itemTmp.eventName = element.alarmMsg;
                itemTmp.eventId = element.alarmCode;
                itemTmp.solution = element.advice;
                result.errorLog.push(itemTmp);
            }
        });

        return result;
    } catch (error) {
        console.log(error);
        throw new Error('Erro ao consultar dados do erro da planta.');
    }
}

export const getChartSolisByType = async (login: string, password: string, date: string, type: string, plantId: string) => {
    try {
        let result: Record<string, any> = {};

        result.chart = {};

        if (type === 'time') {
            result.chart.pac = [];
        } else if (type === 'day') {
            result.chart.energy = [];
        } else if (type === 'mouth') {
            result.chart.energy = [];
        } else if (type === 'year') {
            result.chart.energy = [];
        }

        return result;
    } catch (error) {
        console.log(error);
        throw new Error('Erro ao consultar dados de geração da planta.');
    }
}
