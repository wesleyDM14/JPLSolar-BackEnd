declare module 'growatt' {
    // Configuração para o construtor
    interface Config {
        server?: string;
        indexCandI?: boolean;
        timeout?: number;
        headers?: Record<string, string>;
        lifeSignCallback?: () => void;
    }

    // Respostas comuns da API
    interface ApiResponse {
        result: number;
        msg: string;
    }

    // Dados da planta solar
    interface PlantData {
        timezone: string;
        id: string;
        plantName: string;
        plantData: {
            country: string;
            formulaCo2: string;
            accountName: string;
            city: string;
            timezone: string;
            co2: string;
            gridCompany: string;
            creatDate: string;
            formulaCoal: string;
            gridPort: string;
            designCompany: string;
            fixedPowerPrice: string;
            id: string;
            lat: string;
            valleyPeriodPrice: string;
            tempType: string;
            lng: string;
            locationImg: string;
            tree: string;
            peakPeriodPrice: string;
            installMap: string;
            plantType: string;
            nominalPower: string;
            formulaMoney: string;
            formulaTree: string;
            plantNmi: string;
            flatPeriodPrice: string;
            eTotal: string;
            protocolId: string;
            plantImg: string;
            isShare: string;
            gridServerUrl: string;
            coal: string;
            moneyUnit: string;
            plantName: string;
            moneyUnitText: string;
        };
        weather: {
            city: string;
            Week: string;
            dataStr: string; // Pode ser um JSON stringificado, dependendo do formato
            data: any; // Defina conforme necessário
            radiant: string;
            tempType: number;
        };
        devices: { [key: string]: any }; // Ajuste conforme necessário
    }

    // Interface Growatt com métodos e propriedades
    interface Growatt {
        login(user: string, password: string): Promise<ApiResponse>;
        sharePlantLogin(key: string): Promise<ApiResponse>;
        demoLogin(): Promise<ApiResponse>;
        getAllPlantData(options?: { [key: string]: any }): Promise<{ [key: string]: PlantData }>;
        getDataLoggers(): Promise<any>;
        logout(): Promise<ApiResponse>;
    }

    // Definição da classe Growatt
    class Growatt {
        constructor(config: Config);

        login(user: string, password: string): Promise<ApiResponse>;
        sharePlantLogin(key: string): Promise<ApiResponse>;
        demoLogin(): Promise<ApiResponse>;
        getAllPlantData(options?: { [key: string]: any }): Promise<{ [key: string]: PlantData }>;
        getDataLoggers(): Promise<any>;
        logout(): Promise<ApiResponse>;
    }

    // Exporta a classe Growatt como default
    export default Growatt;
}