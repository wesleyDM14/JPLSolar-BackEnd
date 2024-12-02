import QuickChart from "quickchart-js";
import * as ChartJs from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

export const generateChart = async (powerData: number[], estimatedGeneration: number) => {
    const months = powerData.map((_, i) => `Mês ${i + 1}`);
    const estimatedProdution = Array.from({ length: powerData.length }, () => estimatedGeneration);

    const chart = new QuickChart();
    chart.setConfig({
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Real',
                    data: powerData,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                },
                {
                    label: 'Estimado',
                    data: estimatedProdution,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                },
            ],
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom',
                },
                datalabels: {
                    color: '#000',
                    anchor: 'center',
                    align: 'center',
                    font: {
                        size: 12,
                        weight: 'bold',
                    },
                    formatter: (value: number) => `${value} kWh`,
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
    });

    chart.setWidth(800);
    chart.setHeight(400);

    const chartUrl = chart.getUrl();
    const base64Image = await chart.toDataUrl();

    return base64Image;
}