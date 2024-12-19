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
            const { name, columnId } = req.body;

            if (!name || !columnId) {
                return res.status(400).json({ message: 'Nome da tarefa ou id da coluna é obrogatório' });
            }

            const newTask = await tasksService.createTask(req.user.id, columnId, name);

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
            const { name, columnId } = req.body;

            if (!name || !columnId || !taskId) {
                return res.status(400).json({ message: 'Nome da tarefa ou id da coluna é obrogatório' });
            }

            const newTask = await tasksService.updateTask(columnId, taskId, name, req.user.id);

            return res.status(201).json(newTask);
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

}

export default TasksController;