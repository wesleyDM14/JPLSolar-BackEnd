import prismaClient from "../../prisma";
import axios from "axios";
import { sicrediAuthService } from "./SicrediAuthService";

interface Endereco {
    cep: string;
    cidade: string;
    uf: string;
    logradouro?: string;
    endereco?: string;
    numeroEndereco?: number;
}

interface Pessoa extends Endereco {
    nome: string;
    documento: string;
    tipoPessoa: 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
}

interface DestinatarioSplit {
    codigoBanco: string;
    codigoAgencia: string;
    numeroContaCorrent: string;
    numeroCpfCnpj: string;
    nomeDestinatario: string;
    parcelaRateio: string;
    valorPercentualRateio: number;
    floatSplit: number;
}

interface SplitConfig {
    repasseAutomaticoSplit: 'SIM' | 'NAO';
    tipoValorRateio: 'PERCENTUAL' | 'VALOR';
    regraRateio: 'VALOR_COBRADO';
    destinatarios: DestinatarioSplit[];
}

interface BoletoRequest {
    beneficiarioFinal: Pessoa;
    pagador: Pessoa;
    codigoBeneficiario: string;
    dataVencimento: string;
    especieDocumento: string;
    tipoCobranca: 'NORMAL' | 'HIBRIDO';
    nossoNumero: number;
    seuNumero: string;
    valor: number;
    tipoDesconto: 'VALOR' | 'PERCENTUAL';
    valorDesconto1?: number;
    dataDesconto1?: string;
    valorDesconto2?: number;
    dataDesconto2?: string;
    valorDesconto3?: number;
    dataDesconto3?: string;
    tipoJuros: 'VALOR' | 'PERCENTUAL';
    juros: number;
    multa: number;
    informativos?: string[];
    mensagens?: string[];
    splitBoleto?: SplitConfig;
}

interface BoletoResponse {
    txid: string | null;
    qrCode: string | null;
    linhaDigitavel: string;
    codigoBarras: string;
    cooperativa: string;
    posto: string;
    nossoNumero: string;
}

export class SicrediBoletoService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = process.env.NODE_ENV === 'production'
            ? 'https://api-parceiro.sicredi.com.br/cobranca/boleto/v1/boletos'
            : 'https://api-parceiro.sicredi.com.br/sb/cobranca/boleto/v1/boletos';
    }

    async gerarBoleto(userId: string, boletoData: BoletoRequest): Promise<BoletoResponse> {
        const conta = await prismaClient.conta.findUnique({
            where: { userId },
            select: { posto: true, agencia: true, codBeneficiario: true }
        });

        if (!conta) throw new Error('Conta não encontrada no banco de dados.');

        const token = await sicrediAuthService.getValidToken(userId);
        const apiKey = process.env.SICREDI_API_KEY;

        const response = await axios.post(
            this.baseUrl,
            boletoData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                    'cooperativa': conta.agencia,
                    'posto': conta.posto
                }
            }
        );

        return response.data;
    }
}

export const sicrediBoletoService = new SicrediBoletoService;