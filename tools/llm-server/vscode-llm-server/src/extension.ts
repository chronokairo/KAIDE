import * as http from 'http';
import * as vscode from 'vscode';
import { createServer } from './server';
import { listVSCodeModels } from './modelBridge';

let httpServer: http.Server | undefined;
let outputChannel: vscode.OutputChannel | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;

// ─── Config ───────────────────────────────────────────────────────────────────

interface ServerConfig {
    host: string;
    port: number;
    autoStart: boolean;
}

function getConfig(): ServerConfig {
    const cfg = vscode.workspace.getConfiguration('vscode-llm-server');
    return {
        host: cfg.get<string>('host', '127.0.0.1'),
        port: cfg.get<number>('port', 11434),
        autoStart: cfg.get<boolean>('autoStart', true),
    };
}

// ─── Status bar ───────────────────────────────────────────────────────────────

function setStatusBar(running: boolean, host?: string, port?: number): void {
    if (!statusBarItem) return;
    if (running && host && port) {
        statusBarItem.text = `$(radio-tower) LLM :${port}`;
        statusBarItem.tooltip = `Ollama-compatible LLM Server running at http://${host}:${port}\nClick to stop`;
        statusBarItem.command = 'vscode-llm-server.stop';
        statusBarItem.backgroundColor = undefined;
    } else {
        statusBarItem.text = `$(circle-slash) LLM Server`;
        statusBarItem.tooltip = 'Ollama-compatible LLM Server is stopped\nClick to start';
        statusBarItem.command = 'vscode-llm-server.start';
    }
    statusBarItem.show();
}

// ─── Start / stop ─────────────────────────────────────────────────────────────

async function startServer(): Promise<void> {
    if (httpServer?.listening) {
        vscode.window.showInformationMessage('LLM Server is already running.');
        return;
    }

    const { host, port } = getConfig();

    if (host !== '127.0.0.1' && host !== 'localhost') {
        const choice = await vscode.window.showWarningMessage(
            `LLM Server will bind to ${host}:${port} — this exposes VS Code LLMs to external network clients. Continue?`,
            'Continue',
            'Cancel',
        );
        if (choice !== 'Continue') return;
    }

    outputChannel!.appendLine(`[extension] Starting LLM Server on ${host}:${port}`);
    httpServer = createServer(outputChannel!);

    await new Promise<void>((resolve, reject) => {
        httpServer!.listen(port, host, () => {
            outputChannel!.appendLine(`[server] Listening at http://${host}:${port}`);
            resolve();
        });
        httpServer!.once('error', (err: NodeJS.ErrnoException) => {
            const msg =
                err.code === 'EADDRINUSE'
                    ? `Port ${port} is already in use. Change vscode-llm-server.port in settings.`
                    : err.message;
            outputChannel!.appendLine(`[server] Error: ${msg}`);
            reject(new Error(msg));
        });
    });

    setStatusBar(true, host, port);
    vscode.window.showInformationMessage(
        `LLM Server started at http://${host}:${port} (Ollama-compatible API)`,
    );
}

async function stopServer(): Promise<void> {
    if (!httpServer?.listening) {
        vscode.window.showInformationMessage('LLM Server is not running.');
        return;
    }

    await new Promise<void>((resolve) => {
        httpServer!.close(() => {
            outputChannel!.appendLine('[server] Stopped');
            resolve();
        });
    });

    httpServer = undefined;
    setStatusBar(false);
    vscode.window.showInformationMessage('LLM Server stopped.');
}

// ─── Activation ───────────────────────────────────────────────────────────────

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    outputChannel = vscode.window.createOutputChannel('VS Code LLM Server');
    context.subscriptions.push(outputChannel);

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 90);
    context.subscriptions.push(statusBarItem);
    setStatusBar(false);

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-llm-server.start', async () => {
            try {
                await startServer();
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                vscode.window.showErrorMessage(`Failed to start LLM Server: ${msg}`);
                setStatusBar(false);
            }
        }),

        vscode.commands.registerCommand('vscode-llm-server.stop', async () => {
            await stopServer();
        }),

        vscode.commands.registerCommand('vscode-llm-server.status', () => {
            const { host, port } = getConfig();
            const running = httpServer?.listening === true;
            if (running) {
                vscode.window.showInformationMessage(
                    `LLM Server is running at http://${host}:${port}`,
                );
            } else {
                vscode.window.showInformationMessage('LLM Server is not running.');
            }
            outputChannel!.show();
        }),

        vscode.commands.registerCommand('vscode-llm-server.listModels', async () => {
            const models = await listVSCodeModels();
            if (models.length === 0) {
                vscode.window.showWarningMessage(
                    'No VS Code LM models found. Make sure GitHub Copilot is installed and signed in.',
                );
                return;
            }
            const list = models.map((m) => `${m.name} (${m.details.parameter_size})`).join('\n');
            outputChannel!.appendLine('[models]\n' + list);
            outputChannel!.show();
            vscode.window.showInformationMessage(
                `${models.length} model(s) available. See "VS Code LLM Server" output channel for details.`,
            );
        }),
    );

    // Restart server when config changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(async (e) => {
            if (
                e.affectsConfiguration('vscode-llm-server.host') ||
                e.affectsConfiguration('vscode-llm-server.port')
            ) {
                if (httpServer?.listening) {
                    outputChannel!.appendLine('[extension] Config changed — restarting server');
                    await stopServer();
                    await startServer();
                }
            }
        }),
    );

    const { autoStart } = getConfig();
    if (autoStart) {
        try {
            await startServer();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            outputChannel.appendLine(`[extension] Auto-start failed: ${msg}`);
            setStatusBar(false);
        }
    }
}

export async function deactivate(): Promise<void> {
    if (httpServer?.listening) {
        await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
        httpServer = undefined;
    }
}
