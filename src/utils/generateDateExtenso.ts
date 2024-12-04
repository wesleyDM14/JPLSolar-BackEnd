//Array com os meses do ano em protuguês
const months: string[] = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

//Array com as unidades de 0 a 9 em português
const units: string[] = [
    'zero', 'um', 'dois', 'três', 'quatro', 'cinco',
    'seis', 'sete', 'oito', 'nove'
];

//Array com os números de 10 a 19 em português
const tens: string[] = [
    'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze',
    'dezesseis', 'dezessete', 'dezoito', 'dezenove'
];

//Array com os múltiplos de 10 em português
const tensMultiple: string[] = [
    'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta',
    'setenta', 'oitenta', 'noventa'
];

//Função para converter números de 0 a 99 em palavras
function numberToWords(number: number): string {
    if (number < 10) return units[number];
    if (number < 20) return tens[number - 10];
    if (number < 100) {
        const tensPart: number = Math.floor(number / 10);
        const unitsPart: number = number % 10;
        return `${tensMultiple[tensPart - 2]}${unitsPart > 0 ? ' e ' + units[unitsPart] : ''}`;
    }
    if (number === 100) return 'cem';
    if (number < 1000) {
        const hundredsPart: number = Math.floor(number / 100);
        const remainder: number = number % 100;
        const hundredsText: string = hundredsPart === 1 ? 'cem' : `${units[hundredsPart]} cento`;
        return remainder === 0 ? hundredsText : `${hundredsText} e ${numberToWords(remainder)}`;
    }
    if (number < 1000000) {
        const thousandsPart: number = Math.floor(number / 1000);
        const remainder: number = number % 1000;
        const thousandsText: string = thousandsPart === 1 ? 'mil' : `${numberToWords(thousandsPart)} mil`;
        return remainder === 0 ? thousandsText : `${thousandsText} e ${numberToWords(remainder)}`;
    }
    if (number < 1000000000) {
        const millionsPart: number = Math.floor(number / 1000000);
        const remainder: number = number % 1000000;
        const millionsText: string = millionsPart === 1 ? 'um milhão' : `${numberToWords(millionsPart)} milhões`;
        return remainder === 0 ? millionsText : `${millionsText} e ${numberToWords(remainder)}`;
    }
    return ''; // Extender para números maiores se necessário
}

export const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    const dayText = numberToWords(day);
    const yearText = numberToWords(year);

    return `${dayText} de ${month} de ${yearText}`;
}