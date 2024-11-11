import { ChartConfiguration } from "chart.js";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import ChartDataLabels from 'chartjs-plugin-datalabels';

export const generateChart = async (powerData: number[], estimatedGeneration: number) => {
    const width = 800;  // Largura do gráfico
    const height = 400; // Altura do gráfico
    const chartLib = new ChartJSNodeCanvas({ width, height });

    const months = powerData.map((data, i) => i + 1);
    const estimatedProduction = Array.from({ length: powerData.length }, () => estimatedGeneration);

    const configuration: ChartConfiguration<'bar'> = {
        type: 'bar',
        data: {
            datasets: [
                { label: 'Real', data: powerData, backgroundColor: 'rgba(75, 192, 192, 0.2)' },
                { label: 'Estimado', data: estimatedProduction, backgroundColor: 'rgba(255, 99, 132, 0.2)' },
            ],
            labels: months,
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom',
                },
                datalabels: {
                    anchor: 'center',
                    align: 'center',
                    color: '#333',

                    font: {
                        size: 12
                    },
                    rotation: 270,
                    formatter: (value: number) => `${value.toFixed(2)} kWh`,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Produção (kWh)',
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: 'Mês',
                    },
                },
            },
        },
        plugins: [ChartDataLabels],
    };

    const imageBuffer = await chartLib.renderToBuffer(configuration);
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
}