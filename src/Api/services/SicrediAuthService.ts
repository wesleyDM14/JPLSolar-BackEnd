import axios from "axios";
import prismaClient from "../../prisma";
import qs from 'qs';
import { decryptPassword } from "../../utils/encryptPassword";

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_expires_in: number;
}
class SicrediAuthService {

    private readonly baseUrl: string;
    private readonly apiKey: string;

    constructor() {
        this.baseUrl = process.env.NODE_ENV === 'production'
            ? 'https://api-parceiro.sicredi.com.br/auth/openapi/token'
            : 'https://api-parceiro.sicredi.com.br/sb/auth/openapi/token';
        this.apiKey = process.env.SICREDI_API_KEY || '';
    }

    private async getStoredTokens(userId: string) {
        return await prismaClient.conta.findUnique({
            where: { userId },
            select: {
                accessToken: true,
                refreshToken: true,
                tokenExpireAt: true,
                sicrediLogin: true,
                sicrediPassword: true,
                ivPassword: true,
            }
        });
    }

    private async updateTokens(userId: string, tokens: TokenResponse) {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

        await prismaClient.conta.update({
            where: { userId },
            data: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenExpireAt: expiresAt,
                lastTokenRefresh: new Date()
            }
        });

        return {
            accessToken: tokens.access_token,
            expiresAt
        };
    }

    async authenticate(userId: string) {
        const storedTokens = await this.getStoredTokens(userId);
        if (!storedTokens) throw new Error('Conta não encontrada');

        //Verificar token atual
        if (storedTokens.tokenExpireAt && storedTokens.accessToken && storedTokens.tokenExpireAt > new Date()) {
            return {
                accessToken: storedTokens.accessToken,
                expiresAt: storedTokens.tokenExpireAt
            };
        }

        //tenta refresh token
        if (storedTokens.refreshToken) {
            try {
                const response = await axios.post(this.baseUrl,
                    qs.stringify({
                        grant_type: 'refresh_token',
                        refresh_token: storedTokens.refreshToken,
                    }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'x-api-key': this.apiKey,
                        'context': 'COBRANCA'
                    }
                }
                );
                return await this.updateTokens(userId, response.data);
            } catch (error) {
                // se refresh falahr, segue para auth completa
            }
        }

        const decriptedPassword = decryptPassword(storedTokens.sicrediPassword, storedTokens.ivPassword);

        const response = await axios.post(this.baseUrl,
            qs.stringify({
                grant_type: 'password',
                username: storedTokens.sicrediLogin,
                password: decriptedPassword,
                scope: 'cobranca'
            }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-api-key': this.apiKey,
                'context': 'COBRANCA'
            }
        }
        );

        return await this.updateTokens(userId, response.data);
    }

    async getValidToken(userId: string): Promise<string> {
        const { accessToken } = await this.authenticate(userId);
        return accessToken;
    }
}

export const sicrediAuthService = new SicrediAuthService();