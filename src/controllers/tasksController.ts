import { Request, Response } from "express";
import TasksService from "../services/tasksService";

const tasksService = new TasksService();

class TasksController {

    async createColumn(req: Request, res: Response) {
        try {
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ message: 'Nome da coluna é obrogatório' });
            }

            const newColumn = await tasksService.createColumn(req.user.id, name);

            return res.status(201).json(newColumn);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao criar coluna de tarefas: ' + error.message);
                res.status(500).json({ message: 'Erro ao criar coluna de tarefas: ' + error.message });
            } else {
                console.error('Erro ao criar coluna de tarefas: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao criar coluna de tarefas: Erro desconhecido.' });
            }
        }
    }

    async createTask(req: Request, res: Response) {
        try {
            const { name, columnId, description, data } = req.body;

            if (!name || !columnId || !description) {
                return res.status(400).json({ message: 'Dados faltando na criação de tarefa.' });
            }

            const taskDateTime = data ? new Date(data) : null;

            const newTask = await tasksService.createTask(req.user.id, columnId, name, description, taskDateTime);

            return res.status(201).json(newTask);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao criar tarefa: ' + error.message);
                res.status(500).json({ message: 'Erro ao criar tarefa: ' + error.message });
            } else {
                console.error('Erro ao criar tarefa: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao criar tarefa: Erro desconhecido.' });
            }
        }
    }

    async getColumnsByUserId(req: Request, res: Response) {
        try {
            const columns = await tasksService.getColumnsByUserId(req.user.id);

            return res.status(200).json(columns);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao criar coluna de tarefas: ' + error.message);
                res.status(500).json({ message: 'Erro ao criar coluna de tarefas: ' + error.message });
            } else {
                console.error('Erro ao criar coluna de tarefas: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao criar coluna de tarefas: Erro desconhecido.' });
            }
        }
    }

    async updateTask(req: Request, res: Response) {
        try {
            const taskId = req.params.taskId;
            const { name, description, data, columnId, position } = req.body;

            if (!taskId) {
                return res.status(400).json({ message: 'O ID da tarefa é obrigatório.' });
            }

            const updatedData = {
                name,
                description,
                dataFinal: data ? new Date(data) : null,
                columnId,
                position,
            };

            const updatedTask = await tasksService.updateTask(taskId, req.user.id, updatedData);

            return res.status(200).json({ task: updatedTask, message: 'Tarefa atualziada com sucesso.' });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao criar coluna de tarefas: ' + error.message);
                res.status(500).json({ message: 'Erro ao criar coluna de tarefas: ' + error.message });
            } else {
                console.error('Erro ao criar coluna de tarefas: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao criar coluna de tarefas: Erro desconhecido.' });
            }
        }
    }

    async deleteColumn(req: Request, res: Response) {
        try {
            const columnId = req.params.columnId;

            if (!columnId) {
                return res.status(400).json({ message: 'ID de coluna não informado.' });
            }

            await tasksService.deleteColumn(columnId, req.user.id);

            return res.status(200).json({ message: 'Coluna deletada com sucesso.' });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao deletar coluna de tarefas: ' + error.message);
                res.status(500).json({ message: 'Erro ao deletar coluna de tarefas: ' + error.message });
            } else {
                console.error('Erro ao deletar coluna de tarefas: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao deletar coluna de tarefas: Erro desconhecido.' });
            }
        }
    }

    async deleteTask(req: Request, res: Response) {
        try {
            const taskId = req.params.taskId;

            if (!taskId) {
                return res.status(400).json({ message: 'ID de tarefa não informado.' });
            }

            await tasksService.deleteTask(taskId, req.user.id);

            return res.status(200).json({ message: 'Tarefa deletada com sucesso.' });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao deletar tarefa: ' + error.message);
                res.status(500).json({ message: 'Erro ao deletar tarefa: ' + error.message });
            } else {
                console.error('Erro ao deletar tarefa: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao deletar tarefa: Erro desconhecido.' });
            }
        }
    }


}

export default TasksController;