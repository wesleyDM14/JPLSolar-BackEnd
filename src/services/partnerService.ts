import { hash } from "bcryptjs";
import prismaClient from "../prisma";

class PartnerService {

    async createPartner(name: string, phone: string, address: string, userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        let login = name.split(" ")[0];

        let password = login + '@jplsolar';

        const existente = await prismaClient.user.findUnique({ where: { login } });

        if (existente) {
            login = `${login}${Date.now()}`;
        }

        let hashPassword = await hash(password, 8);

        const newPartner = await prismaClient.user.create({
            data: {
                name: name,
                phone: phone ? phone : null,
                address: address ? address : null,
                montadorId: existingUser.id,
                login: login,
                password: hashPassword,
                role: "PARCEIRO",
            }
        });

        return newPartner;
    }

    async getPartners() {
        const partners = await prismaClient.user.findMany({
            where: {
                role: "PARCEIRO",
            }
        });

        return partners;
    }

    async getPartnersByUserId(userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const partners = await prismaClient.user.findMany({
            where: {
                montadorId: existingUser.id,
                role: "PARCEIRO",
            },
            orderBy: { name: "asc" },
        });

        return partners;
    }

    async getPartnerById(partnerId: string, userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingPartner = await prismaClient.user.findUnique({
            where: { id: partnerId },
            select: {
                address: true,
                id: true,
                contracts: true,
                login: true,
                phone: true,
                name: true,
                role: true,
                montadorId: true,
            },
        });

        if (!existingPartner) {
            throw new Error('Parceiro não encontrado no banco de dados.');
        }

        if (existingPartner.role !== "PARCEIRO") {
            throw new Error('Usuário não listado como parceiro.');
        }

        if (existingPartner.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para acessar este parceiro.');
        }

        return existingPartner;
    }

    async updatePartner(partnerId: string, userId: string, nome: string, phone: string, address: string, login: string, password: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingPartner = await prismaClient.user.findUnique({ where: { id: partnerId } });

        if (!existingPartner || existingPartner.role !== "PARCEIRO") {
            throw new Error('Parceiro não encontrado no banco de dados.');
        }

        if (existingPartner.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para editar este parceiro.');
        }

        let hashPassword = null;

        if (password) {
            hashPassword = await hash(password, 8);
        }

        await prismaClient.user.update({
            where: { id: existingPartner.id },
            data: {
                name: nome ? nome : existingPartner.name,
                address: address ? address : existingPartner.address,
                phone: phone ? phone : existingPartner.phone,
                login: login ? login : existingPartner.login,
                password: hashPassword ? hashPassword : existingPartner.password,
            },
        });

        return;
    }

    async deletePartner(partnerId: string, userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingPartner = await prismaClient.user.findUnique({ where: { id: partnerId } });

        if (!existingPartner || existingPartner.role !== "PARCEIRO") {
            throw new Error('Parceiro não encontrado no banco de dados.');
        }

        if (existingPartner.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para deletar este parceiro.');
        }

        await prismaClient.user.delete({ where: { id: partnerId } });
        return;
    }
}

export default PartnerService;