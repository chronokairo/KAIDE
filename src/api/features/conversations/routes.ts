/**
 * @layer features/conversations
 * @description Rotas para gerenciamento de conversas
 */

import { Router } from 'express';
import { ConversationService } from './service.js';

const router: Router = Router();

// GET /api/conversations - Listar todas as conversas
router.get('/', async (req, res) => {
    try {
        const conversations = await ConversationService.getAllConversations();
        res.json(conversations);
    } catch (error) {
        console.error('Erro ao listar conversas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/conversations/:id - Obter uma conversa específica
router.get('/:id', async (req, res) => {
    try {
        const conversation = await ConversationService.getConversation(req.params.id);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }
        res.json(conversation);
    } catch (error) {
        console.error('Erro ao obter conversa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/conversations - Criar uma nova conversa
router.post('/', async (req, res) => {
    try {
        const { id, title } = req.body;
        if (!id || !title) {
            return res.status(400).json({ error: 'ID e título são obrigatórios' });
        }
        await ConversationService.createConversation(id, title);
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Erro ao criar conversa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/conversations/:id - Atualizar uma conversa
router.put('/:id', async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Título é obrigatório' });
        }
        await ConversationService.updateConversation(req.params.id, title);
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar conversa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/conversations/:id - Deletar uma conversa
router.delete('/:id', async (req, res) => {
    try {
        await ConversationService.deleteConversation(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar conversa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/conversations/:id/messages - Adicionar uma mensagem
router.post('/:id/messages', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }
        await ConversationService.addMessage(req.params.id, message);
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Erro ao adicionar mensagem:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/messages/:id - Atualizar uma mensagem
router.put('/messages/:id', async (req, res) => {
    try {
        const { content, isStreaming, sources, charts } = req.body;
        await ConversationService.updateMessage(req.params.id, content, isStreaming, sources, charts);
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar mensagem:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;