import { EstadoCivil, Genero } from '@prisma/client';
import prismaClient from '../prisma';

class ContractService {

    //Create
    async createContract(
        nome: string,
        email: string,
        profissao: string,
        estadoCivil: EstadoCivil,
        dataNascimento: Date,
        cpf: string,
        rg: string,
        dataContrato: Date,
        carencia: number,
        dataPrimeiraParcela: Date,
        quantParcelas: number,
        priceTotal: number,
        priceParcela: number,
        modeloModulos: string,
        potModulos: number,
        modeloInversor: string,
        potInversor: number,
        avalista: boolean,
        logradouro: string,
        numero: number,
        bairro: string,
        cidade: string,
        uf: string,
        cep: string,
        nomeAvalista: string,
        profissaoAvalista: string,
        cpfAvalista: string,
        logradouroAvalista: string,
        numeroAvalista: number,
        bairroAvalista: string,
        cidadeAvalista: string,
        ufAvalista: string,
        cepAvalista: string,
        genero: Genero,
        userId: string
    ) {
        try {
            return await prismaClient.$transaction(async (prisma) => {
                //cria endereco do contrato
                const newAddress = await prisma.endereco.create({
                    data: {
                        logradouro: logradouro,
                        numero: numero,
                        bairro: bairro,
                        cidade: cidade,
                        uf: uf,
                        cep: cep
                    },
                });

                //Cria avalista e endereço do avalista, se houver
                let newAvalista = null;
                if (avalista) {
                    let newAvalistaAddress = await prisma.endereco.create({
                        data: {
                            logradouro: logradouroAvalista,
                            numero: numeroAvalista,
                            bairro: bairroAvalista,
                            cidade: cidadeAvalista,
                            uf: ufAvalista,
                            cep: cepAvalista
                        }
                    });

                    newAvalista = await prisma.avalista.create({
                        data: {
                            nome: nomeAvalista,
                            profissao: profissaoAvalista,
                            cpf: cpfAvalista,
                            enderecoId: newAvalistaAddress.id
                        }
                    });
                }

                //Cria o contrato
                const newContract = await prisma.contract.create({
                    data: {
                        nome: nome,
                        email: email,
                        profissao: profissao,
                        estadoCivil: estadoCivil,
                        dataNascimento: dataNascimento,
                        cpf: cpf,
                        rg: rg,
                        dataContrato: dataContrato,
                        carencia: carencia,
                        dataPrimeiraParcela: dataPrimeiraParcela,
                        modeloInversor: modeloInversor,
                        modeloModulos: modeloModulos,
                        potInversor: potInversor,
                        potModulos: potModulos,
                        priceParcela: priceParcela,
                        priceTotal: priceTotal,
                        quantParcelas: quantParcelas,
                        genero: genero,
                        enderecoId: newAddress.id,
                        avalistaId: newAvalista ? newAvalista.id : null,
                        userId: userId
                    }
                });

                //Gerar promissoria
                const promissoriaYear = new Date(dataContrato).getFullYear();
                const lastPromissoria = await prisma.promissoria.findFirst({
                    where: { ano: promissoriaYear },
                    orderBy: { numero: 'desc' }
                });

                const numeroPromissoria = lastPromissoria ? lastPromissoria.numero + 1 : 1;

                const newPromissoria = await prisma.promissoria.create({
                    data: {
                        ano: promissoriaYear,
                        numero: numeroPromissoria,
                        contractId: newContract.id
                    }
                });

                return { newContract, newPromissoria };
            }, {
                timeout: 120000
            });


        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao cadastrar o contrato: ' + error.message);
                throw new Error('Erro ao cadastraro contrato: ' + error.message);
            } else {
                console.error('Erro ao cadastrar o contrato: Erro desconhecido');
                throw new Error('Erro ao cadastraro contrato: Erro desconhecido');
            }
        }
    }

    //Read All
    async getContracts() {
        const contratos = await prismaClient.contract.findMany();
        return contratos;
    }

    //Read All for user
    async getContractsByUser(userId: string, loggedUserId: string) {
        const loggedUser = await prismaClient.user.findUnique({
            where: { id: loggedUserId },
        });

        if (!loggedUser) {
            throw new Error('Usuário logado não encontrado no Banco de Dados.');
        }

        const targetUser = await prismaClient.user.findUnique({
            where: { id: userId },
        });

        if (!targetUser) {
            throw new Error('Usuário alvo não encontrado no Banco de Dados.');
        }

        if (loggedUser.role === 'ADMIN') {

            return await prismaClient.contract.findMany({
                where: { userId },
                include: {
                    endereco: true,
                    avalista: {
                        include: {
                            endereco: true,
                        },
                    },
                    User: {
                        select: {
                            name: true,
                        },
                    },
                },
            });
        }

        if (loggedUser.role === 'MONTADOR') {
            if (targetUser.role === 'MONTADOR') {

                if (loggedUser.id !== targetUser.id) {
                    throw new Error('Montadores só podem acessar seus próprios dados.');
                }

                return await prismaClient.contract.findMany({
                    where: {
                        OR: [
                            { userId: loggedUser.id },
                            { User: { montadorId: loggedUser.id } },
                        ],
                    },
                    include: {
                        endereco: true,
                        avalista: {
                            include: {
                                endereco: true,
                            },
                        },
                        User: {
                            select: {
                                name: true,
                            },
                        },
                    },
                });
            } else if (targetUser.role === 'PARCEIRO') {

                if (targetUser.montadorId !== loggedUser.id) {
                    throw new Error('Você não tem permissão para acessar os contratos desse Parceiro.');
                }

                return await prismaClient.contract.findMany({
                    where: { userId },
                    include: {
                        endereco: true,
                        avalista: {
                            include: {
                                endereco: true,
                            },
                        },
                        User: {
                            select: {
                                name: true,
                            },
                        },
                    },
                });
            }
        }

        if (loggedUser.role === 'PARCEIRO') {

            if (loggedUser.id !== userId) {
                throw new Error('Você só pode acessar seus próprios contratos.');
            }

            return await prismaClient.contract.findMany({
                where: { userId: loggedUser.id },
                include: {
                    endereco: true,
                    avalista: {
                        include: {
                            endereco: true,
                        },
                    },
                    User: {
                        select: {
                            name: true,
                        },
                    },
                },
            });
        }

        throw new Error('Permissão negada.');
    }

    //Read unique
    async getContractById(contratoId: string, userId: string) {
        const userExisting = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!userExisting) {
            throw new Error('Usuário não encontrado no Banco de Dados.');
        }

        const contractExisting = await prismaClient.contract.findFirst({
            where: { id: contratoId },
            include: {
                endereco: true,
                avalista: {
                    include: {
                        endereco: true
                    }
                }
            }
        });

        if (!contractExisting) {
            throw new Error('Contrato não encontrado no Banco de Dados.');
        }

        if (contractExisting.userId !== userExisting.id && userExisting.role !== "ADMIN") {
            if (userExisting.role === "MONTADOR") {
                const partner = await prismaClient.user.findUnique({
                    where: { id: contractExisting.userId },
                    select: {
                        id: true,
                        montadorId: true,
                    },
                });

                if (partner?.montadorId !== userExisting.id) {
                    throw new Error('Você não tem permissão para acessar este contrato.');
                }
            } else {
                throw new Error('Você não tem permissão para acessar este contrato.');
            }
        }

        return contractExisting;
    }

    //Update
    async updateContract(
        userId: string,
        contractId: string,
        nome: string,
        email: string,
        profissao: string,
        estadoCivil: EstadoCivil,
        dataNascimento: Date,
        cpf: string,
        rg: string,
        dataContrato: Date,
        carencia: number,
        dataPrimeiraParcela: Date,
        quantParcelas: number,
        priceTotal: number,
        priceParcela: number,
        modeloModulos: string,
        potModulos: number,
        modeloInversor: string,
        potInversor: number,
        avalista: boolean,
        logradouro: string,
        numero: number,
        bairro: string,
        cidade: string,
        uf: string,
        cep: string,
        nomeAvalista: string,
        profissaoAvalista: string,
        cpfAvalista: string,
        logradouroAvalista: string,
        numeroAvalista: number,
        bairroAvalista: string,
        cidadeAvalista: string,
        ufAvalista: string,
        cepAvalista: string,
        genero: Genero
    ) {
        try {
            return await prismaClient.$transaction(async (prisma) => {

                const userExisting = await prisma.user.findUnique({ where: { id: userId } });

                if (!userExisting) {
                    throw new Error('Usuário não encontrado no Banco de Dados.');
                }
                // Verificar se o contrato existe
                const existingContract = await prisma.contract.findUnique({
                    where: { id: contractId },
                    include: { avalista: true, endereco: true }
                });

                if (!existingContract) {
                    throw new Error('Contrato não encontrado.');
                }

                if (existingContract.userId !== userExisting.id && userExisting.role !== "ADMIN") {
                    if (userExisting.role === "MONTADOR") {
                        const partner = await prismaClient.user.findUnique({
                            where: { id: existingContract.userId },
                            select: {
                                id: true,
                                montadorId: true,
                            },
                        });

                        if (partner?.montadorId !== userExisting.id) {
                            throw new Error('Você não tem permissão para atualizar este contrato.');
                        }
                    } else {
                        throw new Error('Você não tem permissão para atualizar este contrato.');
                    }
                }

                // Atualizar endereço do contrato
                await prisma.endereco.update({
                    where: { id: existingContract.enderecoId },
                    data: { logradouro, numero, bairro, cidade, uf, cep }
                });

                // Atualizar ou criar avalista
                let updatedAvalista = null;
                if (avalista) {
                    if (existingContract.avalista && existingContract.avalistaId) {
                        // Atualizar avalista existente
                        await prisma.endereco.update({
                            where: { id: existingContract.avalista.enderecoId },
                            data: {
                                logradouro: logradouroAvalista,
                                numero: numeroAvalista,
                                bairro: bairroAvalista,
                                cidade: cidadeAvalista,
                                uf: ufAvalista,
                                cep: cepAvalista
                            }
                        });

                        updatedAvalista = await prisma.avalista.update({
                            where: { id: existingContract.avalistaId },
                            data: {
                                nome: nomeAvalista,
                                profissao: profissaoAvalista,
                                cpf: cpfAvalista
                            }
                        });
                    } else {
                        // Criar novo avalista
                        const newAvalistaAddress = await prisma.endereco.create({
                            data: {
                                logradouro: logradouroAvalista,
                                numero: numeroAvalista,
                                bairro: bairroAvalista,
                                cidade: cidadeAvalista,
                                uf: ufAvalista,
                                cep: cepAvalista
                            }
                        });

                        updatedAvalista = await prisma.avalista.create({
                            data: {
                                nome: nomeAvalista,
                                profissao: profissaoAvalista,
                                cpf: cpfAvalista,
                                enderecoId: newAvalistaAddress.id
                            }
                        });
                    }
                } else if (existingContract.avalistaId) {
                    // Remover avalista existente se nenhum avalista for fornecido
                    await prisma.avalista.delete({
                        where: { id: existingContract.avalistaId }
                    });
                }

                // Atualizar contrato
                const updatedContract = await prisma.contract.update({
                    where: { id: contractId },
                    data: {
                        nome, email, profissao, estadoCivil, dataNascimento, cpf, rg, dataContrato, carencia,
                        dataPrimeiraParcela, quantParcelas, priceTotal, priceParcela, modeloModulos,
                        potModulos, modeloInversor, potInversor, genero,
                        avalistaId: updatedAvalista ? updatedAvalista.id : null
                    }
                });

                return updatedContract;
            }, {
                timeout: 60000
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao atualizar o contrato: ' + error.message);
                throw new Error('Erro ao atualizar o contrato: ' + error.message);
            } else {
                console.error('Erro ao atualizar o contrato: Erro desconhecido');
                throw new Error('Erro ao atualizar o contrato: Erro desconhecido');
            }
        }
    }

    //Delete
    async deleteContract(contractId: string, userId: string) {
        const userExisting = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!userExisting) {
            throw new Error('Usuário não encontrado no Banco de Dados.');
        }

        const contractExisting = await prismaClient.contract.findUnique({
            where: { id: contractId },
        });

        if (!contractExisting) {
            throw new Error('Contrato não encontrado no Banco de Dados.');
        }

        if (contractExisting.userId !== userExisting.id && userExisting.role !== "ADMIN") {
            if (userExisting.role === "MONTADOR") {
                const partner = await prismaClient.user.findUnique({
                    where: { id: contractExisting.userId },
                    select: {
                        id: true,
                        montadorId: true,
                    },
                });

                if (partner?.montadorId !== userExisting.id) {
                    throw new Error('Você não tem permissão para deletar este contrato.');
                }
            } else {
                throw new Error('Você não tem permissão para deletar este contrato.');
            }
        }

        // Excluir o contrato
        await prismaClient.contract.delete({
            where: { id: contractId },
        });

        return;
    }
}

export default ContractService;