import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const prisma = new PrismaClient();
const DEFAULT_ACCOUNT_ID = parseInt(process.env.MCP_ACCOUNT_ID || '1');

// ─── Tool Definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'search_conversations',
    description:
      'Lista conversas do CRM, com filtro opcional por status. Retorna contato, último mensagem, status e responsável.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['open', 'pending', 'resolved'],
          description: 'Filtro de status (open=abertas, pending=pendentes, resolved=resolvidas)',
        },
        limit: {
          type: 'number',
          description: 'Máximo de resultados (padrão: 10)',
        },
      },
    },
  },
  {
    name: 'get_conversation_details',
    description:
      'Retorna todos os detalhes de uma conversa específica, incluindo o histórico completo de mensagens.',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: {
          type: 'number',
          description: 'ID numérico da conversa',
        },
      },
      required: ['conversationId'],
    },
  },
  {
    name: 'search_contacts',
    description: 'Busca contatos cadastrados no CRM por nome ou e-mail.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Texto para busca (nome ou e-mail)',
        },
        limit: {
          type: 'number',
          description: 'Máximo de resultados (padrão: 10)',
        },
      },
    },
  },
  {
    name: 'get_dashboard_summary',
    description:
      'Retorna métricas gerais do CRM: total de conversas por status, total de contatos e atividade recente.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_conversation',
    description:
      'Cria uma nova conversa para um contato em um canal (inbox) específico, com mensagem inicial opcional.',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: {
          type: 'number',
          description: 'ID do contato',
        },
        inboxId: {
          type: 'number',
          description: 'ID do inbox (canal de comunicação)',
        },
        message: {
          type: 'string',
          description: 'Mensagem inicial (opcional)',
        },
      },
      required: ['contactId', 'inboxId'],
    },
  },
  {
    name: 'update_conversation_status',
    description: 'Atualiza o status de uma conversa existente.',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: {
          type: 'number',
          description: 'ID da conversa',
        },
        status: {
          type: 'string',
          enum: ['open', 'pending', 'resolved'],
          description: 'Novo status',
        },
      },
      required: ['conversationId', 'status'],
    },
  },
  {
    name: 'list_inboxes',
    description: 'Lista todos os canais (inboxes) disponíveis na conta.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'send_message',
    description: 'Envia uma mensagem em uma conversa existente.',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: {
          type: 'number',
          description: 'ID da conversa',
        },
        content: {
          type: 'string',
          description: 'Conteúdo da mensagem',
        },
        isPrivate: {
          type: 'boolean',
          description: 'Se true, a mensagem é uma nota privada (não visível ao contato)',
        },
      },
      required: ['conversationId', 'content'],
    },
  },
];

// ─── Tool Execution ────────────────────────────────────────────────────────────

async function executeTool(name, args) {
  const accId = DEFAULT_ACCOUNT_ID;

  switch (name) {
    case 'search_conversations': {
      const where = { accountId: accId };
      if (args.status) where.status = args.status;

      const conversations = await prisma.conversation.findMany({
        where,
        include: {
          contact: { select: { id: true, name: true, email: true, phone: true } },
          inbox: { select: { id: true, name: true, channelType: true } },
          assignee: { select: { id: true, name: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          labels: { include: { label: { select: { name: true, color: true } } } },
        },
        orderBy: { lastActivityAt: 'desc' },
        take: Math.min(Number(args.limit) || 10, 25),
      });

      return conversations.map((c) => ({
        id: c.id,
        displayId: c.displayId,
        status: c.status,
        priority: c.priority,
        contact: c.contact?.name || 'Visitante',
        contactEmail: c.contact?.email,
        inbox: c.inbox?.name,
        assignee: c.assignee?.name || 'Não atribuído',
        labels: c.labels.map((l) => l.label.name),
        lastMessage: c.messages[0]?.content || '(sem mensagens)',
        lastActivityAt: c.lastActivityAt,
      }));
    }

    case 'get_conversation_details': {
      const conv = await prisma.conversation.findFirst({
        where: { id: parseInt(args.conversationId), accountId: accId },
        include: {
          contact: true,
          inbox: true,
          assignee: { select: { id: true, name: true } },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              sender: { select: { id: true, name: true } },
              contactSender: { select: { id: true, name: true } },
            },
          },
          labels: { include: { label: { select: { name: true } } } },
        },
      });

      if (!conv) return { error: 'Conversa não encontrada' };

      return {
        id: conv.id,
        displayId: conv.displayId,
        status: conv.status,
        priority: conv.priority,
        contact: {
          id: conv.contact?.id,
          name: conv.contact?.name,
          email: conv.contact?.email,
          phone: conv.contact?.phone,
        },
        inbox: conv.inbox?.name,
        assignee: conv.assignee?.name || 'Não atribuído',
        labels: conv.labels.map((l) => l.label.name),
        messageCount: conv.messages.length,
        messages: conv.messages.map((m) => ({
          id: m.id,
          type: m.messageType,
          content: m.content,
          isPrivate: m.private,
          sender:
            m.messageType === 'outgoing'
              ? m.sender?.name || 'Agente'
              : m.contactSender?.name || 'Visitante',
          createdAt: m.createdAt,
        })),
        createdAt: conv.createdAt,
        lastActivityAt: conv.lastActivityAt,
      };
    }

    case 'search_contacts': {
      const where = { accountId: accId };
      if (args.query) {
        where.OR = [
          { name: { contains: args.query, mode: 'insensitive' } },
          { email: { contains: args.query, mode: 'insensitive' } },
        ];
      }

      const contacts = await prisma.contact.findMany({
        where,
        take: Math.min(Number(args.limit) || 10, 25),
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          _count: { select: { conversations: true } },
        },
      });

      return contacts.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        totalConversations: c._count.conversations,
        createdAt: c.createdAt,
      }));
    }

    case 'get_dashboard_summary': {
      const [open, pending, resolved, totalContacts, recentConversations, totalMessages] =
        await Promise.all([
          prisma.conversation.count({ where: { accountId: accId, status: 'open' } }),
          prisma.conversation.count({ where: { accountId: accId, status: 'pending' } }),
          prisma.conversation.count({ where: { accountId: accId, status: 'resolved' } }),
          prisma.contact.count({ where: { accountId: accId } }),
          prisma.conversation.findMany({
            where: { accountId: accId },
            include: {
              contact: { select: { name: true } },
              messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
            orderBy: { lastActivityAt: 'desc' },
            take: 5,
          }),
          prisma.message.count({ where: { accountId: accId } }),
        ]);

      return {
        conversations: { open, pending, resolved, total: open + pending + resolved },
        totalContacts,
        totalMessages,
        recentConversations: recentConversations.map((c) => ({
          id: c.id,
          displayId: c.displayId,
          contact: c.contact?.name || 'Visitante',
          status: c.status,
          lastMessage: c.messages[0]?.content || '(sem mensagens)',
          lastActivityAt: c.lastActivityAt,
        })),
      };
    }

    case 'create_conversation': {
      const [lastConv, contact, inbox] = await Promise.all([
        prisma.conversation.findFirst({
          where: { accountId: accId },
          orderBy: { displayId: 'desc' },
        }),
        prisma.contact.findFirst({ where: { id: parseInt(args.contactId), accountId: accId } }),
        prisma.inbox.findFirst({ where: { id: parseInt(args.inboxId), accountId: accId } }),
      ]);

      if (!contact) return { error: 'Contato não encontrado' };
      if (!inbox) return { error: 'Inbox não encontrado' };

      const displayId = (lastConv?.displayId || 0) + 1;
      const conversation = await prisma.conversation.create({
        data: {
          displayId,
          accountId: accId,
          contactId: parseInt(args.contactId),
          inboxId: parseInt(args.inboxId),
          status: 'open',
          lastActivityAt: new Date(),
        },
      });

      if (args.message) {
        await prisma.message.create({
          data: {
            accountId: accId,
            conversationId: conversation.id,
            content: args.message,
            messageType: 'outgoing',
            senderType: 'User',
          },
        });
      }

      return {
        success: true,
        conversationId: conversation.id,
        displayId: conversation.displayId,
        contact: contact.name,
        inbox: inbox.name,
      };
    }

    case 'update_conversation_status': {
      const conv = await prisma.conversation.findFirst({
        where: { id: parseInt(args.conversationId), accountId: accId },
      });

      if (!conv) return { error: 'Conversa não encontrada' };

      const updated = await prisma.conversation.update({
        where: { id: parseInt(args.conversationId) },
        data: { status: args.status, lastActivityAt: new Date() },
      });

      return {
        success: true,
        conversationId: updated.id,
        displayId: updated.displayId,
        newStatus: updated.status,
      };
    }

    case 'list_inboxes': {
      const inboxes = await prisma.inbox.findMany({
        where: { accountId: accId },
        select: { id: true, name: true, channelType: true, createdAt: true },
        orderBy: { name: 'asc' },
      });
      return inboxes;
    }

    case 'send_message': {
      const conv = await prisma.conversation.findFirst({
        where: { id: parseInt(args.conversationId), accountId: accId },
      });

      if (!conv) return { error: 'Conversa não encontrada' };

      const message = await prisma.message.create({
        data: {
          accountId: accId,
          conversationId: parseInt(args.conversationId),
          content: args.content,
          messageType: 'outgoing',
          senderType: 'User',
          private: args.isPrivate || false,
        },
      });

      await prisma.conversation.update({
        where: { id: parseInt(args.conversationId) },
        data: { lastActivityAt: new Date() },
      });

      return {
        success: true,
        messageId: message.id,
        conversationId: conv.id,
        displayId: conv.displayId,
        isPrivate: message.private,
      };
    }

    default:
      return { error: `Ferramenta desconhecida: ${name}` };
  }
}

// ─── MCP Server Setup ──────────────────────────────────────────────────────────

const server = new Server(
  { name: 'nosso-sales', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await executeTool(name, args || {});
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Erro ao executar ferramenta: ${err.message}` }],
      isError: true,
    };
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

const transport = new StdioServerTransport();
await server.connect(transport);
