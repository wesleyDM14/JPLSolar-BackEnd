//import QuickChart from "quickchart-js";

const QuickChart = require('quickchart-js');

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
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                datalabels: {
                    display: true,
                    color: '#000',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    formatter: (value: number) => `${value.toFixed(2)} kWh`,
                    anchor: 'center',
                    align: 'middle',
                    rotation: 90,
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
    });

    chart.setWidth(800);
    chart.setHeight(400);

    const base64Image = await chart.toDataUrl();

    return base64Image;
}