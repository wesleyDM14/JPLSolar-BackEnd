import prismaClient from "../prisma";

class TasksService {

    async createColumn(userId: string, columnTitle: string) {
        const existingColumn = await prismaClient.column.findFirst({ where: { title: columnTitle, montadorId: userId } });

        if (existingColumn) {
            throw new Error('Coluna com esse titulo já cadastrada.');
        }

        const newColumn = await prismaClient.column.create({
            data: {
                title: columnTitle,
                montadorId: userId,
            }
        });

        return newColumn;
    }

    async createTask(userId: string, columnId: string, taskName: string, taskDescription: string, taskDateTime: Date | null) {
        const existingColumn = await prismaClient.column.findUnique({ where: { id: columnId } });

        if (!existingColumn) {
            throw new Error('Coluna de tarefas não encontrada no banco de dados.');
        }

        if (existingColumn.montadorId !== userId) {
            throw new Error('Você não tem permissão para cadastrar tarefas nessa coluna.');
        }

        const newTask = await prismaClient.task.create({
            data: {
                name: taskName,
                description: taskDescription,
                dataFinal: taskDateTime,
                columnId: columnId,
            }
        });

        return newTask;
    }

    async getColumnsByUserId(userId: string) {
        const columns = await prismaClient.column.findMany({
            where: { montadorId: userId },
            include: { Task: true },
            orderBy: {
                createdAt: 'asc',
            }
        });
        return columns;
    }

    async updateTask(taskId: string, userId: string, updatedData: { name?: string; description?: string; dataFinal?: Date | null; columnId?: string; position?: number }) {
        const existingTask = await prismaClient.task.findUnique({
            where: { id: taskId },
            include: { columm: true },
        });

        if (!existingTask) {
            throw new Error('Tarefa não encontrada no banco de dados.');
        }

        if (existingTask.columm.montadorId !== userId) {
            throw new Error('Você não tem permissão para atualizar esta tarefa.');
        }

        const updatedTask = await prismaClient.task.update({
            where: { id: taskId },
            data: {
                ...updatedData,
            },
        });

        return updatedTask;
    }

    async deleteColumn(columnId: string, userId: string) {
        const existingColumn = await prismaClient.column.findUnique({ where: { id: columnId } });

        if (!existingColumn) {
            throw new Error('Coluna não encontrada no banco de dados.');
        }

        if (existingColumn.montadorId !== userId) {
            throw new Error('Você não tem permissão para deletar essa coluna.');
        }

        await prismaClient.column.delete({ where: { id: existingColumn.id } });

        return;
    }

    async deleteTask(taskId: string, userId: string) {
        const existingTask = await prismaClient.task.findUnique({ where: { id: taskId }, include: { columm: true } });

        if (!existingTask) {
            throw new Error('Tarefa não encontrada no banco de dados.');
        }

        if (existingTask.columm.montadorId !== userId) {
            throw new Error('Você não tem permissão para deletar a tarefa.');
        }

        await prismaClient.task.delete({ where: { id: existingTask.id } });

        return;
    }

}

export default TasksService;