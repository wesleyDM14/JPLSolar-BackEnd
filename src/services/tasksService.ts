import prismaClient from "../prisma";

class TasksService {

    async createColumn(userId: string, columnTitle: string) {
        const existingColumn = await prismaClient.column.findFirst({ where: { title: columnTitle } });

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

    async createTask(userId: string, columnId: string, taskName: string) {
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
                description: taskName,
                columnId: columnId,
            }
        });

        return newTask;
    }

    async getColumnsByUserId(userId: string) {
        const columns = await prismaClient.column.findMany({ 
            where: { montadorId: userId },
            include: { Task: true }
        });
        return columns;
    }

    async updateTask(columnId: string, taskId: string, name: string, userId: string) {
        const existingColumn = await prismaClient.column.findUnique({ where: { id: columnId } });

        if (!existingColumn) {
            throw new Error('Coluna não encontrada no banco de dados.');
        }

        if (existingColumn.montadorId !== userId) {
            throw new Error('Você não tem permissão para cadastrar tarefas nessa coluna.');
        }

        const existingTask = await prismaClient.task.findUnique({ where: { id: taskId } });

        if (!existingTask) {
            throw new Error('Tarefa não encontrada no banco de dados.');
        }

        const updatedTask = await prismaClient.task.update({
            where: { id: taskId },
            data: {
                columnId: columnId,
                name: name,
            }
        });

        return updatedTask;
    }

}

export default TasksService;