import { ChatService } from '@anamnesic/core';
import { z } from 'zod';
import { execSync } from 'child_process';

type ToolResponse = { content: Array<{ type: string; text?: string; data?: unknown }> };

interface McpToolServer {
  tool(
    name: string,
    description: string,
    schema: Record<string, unknown>,
    handler: (args: any) => Promise<ToolResponse>
  ): void;
}

export function registerChatEndpoints(server: McpToolServer) {
  const chatService = new ChatService('default');

  server.tool(
    'get_chat_history',
    'Retrieve chat history with an optional limit.',
    { limit: z.number().optional().describe('Maximum number of messages to retrieve') },
    async ({ limit }: { limit?: number }) => {
      const history = chatService.getHistory(limit);
      return { content: [{ type: 'json', data: history }] };
    }
  );

  server.tool(
    'backup_chat',
    'Create a backup of the current chat history.',
    {},
    async () => {
      chatService.backup();
      return { content: [{ type: 'text', text: 'Chat history backed up successfully.' }] };
    }
  );

  server.tool(
    'restore_chat',
    'Restore chat history from the latest backup.',
    {},
    async () => {
      chatService.restore();
      return { content: [{ type: 'text', text: 'Chat history restored from backup.' }] };
    }
  );

  server.tool(
    'clear_chat',
    'Clear all chat history.',
    {},
    async () => {
      chatService.clear();
      return { content: [{ type: 'text', text: 'Chat history cleared.' }] };
    }
  );

  // --- Collaborative Chat Tools ---

  server.tool(
    'chat_send_message',
    'Send a message to the collaborative chat channel. Other AI instances (Claude Desktop, Copilot, Cursor) can read and respond. Use type "response" when replying, "info" for status updates, "code" for code snippets, "error" for error reports.',
    {
      content: z.string().describe('The message content to send'),
      type: z.enum(['response', 'info', 'code', 'error']).default('response').describe('Message type'),
      sender: z.string().default('ai').describe('Sender identifier (e.g. "copilot", "claude-desktop", "cursor")'),
      senderLabel: z.string().optional().describe('Human-readable sender name'),
      replyTo: z.string().optional().describe('ID of the message being replied to'),
      mentions: z.array(z.string()).optional().describe('Agent roles to mention/trigger'),
    },
    async ({ content, type, sender, senderLabel, replyTo, mentions }: {
      content: string;
      type: string;
      sender: string;
      senderLabel?: string;
      replyTo?: string;
      mentions?: string[];
    }) => {
      const msg = chatService.send({
        content,
        type,
        sender,
        senderLabel,
        replyTo,
        mentions,
      });
      return {
        content: [
          { type: 'text', text: `Message sent (id: ${msg.id})` },
          { type: 'json', data: msg },
        ],
      };
    }
  );

  server.tool(
    'chat_get_pending',
    'Get pending messages from the programmer that no AI has responded to yet. Use this to poll for new tasks/questions. Messages are marked as read after retrieval.',
    {},
    async () => {
      const pending = chatService.getUnread();
      // Mark retrieved messages as read so other AIs know they were picked up
      for (const msg of pending) {
        chatService.markRead(msg.id);
      }
      return {
        content: [
          {
            type: 'text',
            text: pending.length > 0
              ? `${pending.length} pending message(s) found and marked as read.`
              : 'No pending messages.',
          },
          { type: 'json', data: pending },
        ],
      };
    }
  );

  server.tool(
    'chat_execute_and_reply',
    'Execute a shell command in the workspace and post the output as a chat message. Useful for running build, test, lint, or any CLI command and sharing the result with all connected AIs.',
    {
      command: z.string().describe('Shell command to execute (e.g. "pnpm build", "pnpm test", "git status")'),
      cwd: z.string().optional().describe('Working directory (defaults to workspace root)'),
      replyTo: z.string().optional().describe('ID of the message this execution responds to'),
      sender: z.string().default('ai').describe('Sender identifier'),
      timeoutMs: z.number().default(60000).describe('Command timeout in milliseconds (default 60s)'),
    },
    async ({ command, cwd, replyTo, sender, timeoutMs }: {
      command: string;
      cwd?: string;
      replyTo?: string;
      sender: string;
      timeoutMs: number;
    }) => {
      let output: string;
      let success: boolean;
      try {
        output = execSync(command, {
          cwd: cwd || process.cwd(),
          encoding: 'utf-8',
          timeout: timeoutMs,
          maxBuffer: 1024 * 1024,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        success = true;
      } catch (err: any) {
        output = err.stdout || err.stderr || err.message || 'Command failed with no output';
        success = false;
      }

      const trimmedOutput = output.length > 4000
        ? output.slice(0, 2000) + '\n\n... (truncated) ...\n\n' + output.slice(-1500)
        : output;

      const msg = chatService.send({
        content: `**\`${command}\`** ${success ? '✅' : '❌'}\n\`\`\`\n${trimmedOutput}\n\`\`\``,
        type: success ? 'code' : 'error',
        sender,
        senderLabel: `exec:${sender}`,
        replyTo,
      });

      return {
        content: [
          {
            type: 'text',
            text: success
              ? `Command succeeded. Output posted to chat (msg: ${msg.id}).`
              : `Command failed. Error posted to chat (msg: ${msg.id}).`,
          },
          { type: 'json', data: { success, messageId: msg.id, output: trimmedOutput } },
        ],
      };
    }
  );
}