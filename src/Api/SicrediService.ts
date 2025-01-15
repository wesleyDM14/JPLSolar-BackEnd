import axios from "axios";
import prismaClient from "../prisma";

class SicrediService {

    private acessToken: string | null = null;
    private refreshToken: string | null = null;
    private acessTokenExpiresAt: number | null = null;
    private refreshTokenExpireAt: number | null = null;

    private async refreshAccessToken(): Promise<void> {

    }

    async authenticate(): Promise<void> {

    }

    async createBoleto(): Promise<any> {

    }

    async getBoleto(): Promise<any> {

    }

    async cancelBoleto(): Promise<void> {

    }
}

export default SicrediService;