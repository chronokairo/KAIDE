# Forgepair

**Dois modelos, um terminal, um projeto.**

Forgepair é um orquestrador de agentes escrito em Common Lisp e sem bibliotecas
de terceiros. Dois modelos de IA conversam, alternam turnos e executam comandos
para analisar, testar e melhorar o repositório. Você acompanha tudo em um TUI e
pode enviar observações sem interromper a conversa entre os agentes.

## Como funciona

1. O primeiro modelo recebe o objetivo descrito em `GOAL.md`.
2. Ele responde com uma mensagem para o parceiro e, opcionalmente, um comando.
3. O comando é executado dentro de um sandbox Bubblewrap.
4. O segundo modelo recebe a mensagem, o comando e a saída do terminal.
5. Os modelos continuam alternando pelo número de turnos configurado.

O provedor não precisa ser diferente: a configuração padrão utiliza dois modelos
distintos da NVIDIA NIM.

## Requisitos

- Linux;
- SBCL;
- curl;
- Git;
- Bubblewrap (`bwrap`);
- uma chave da NVIDIA NIM.

Em Debian ou Ubuntu:

```bash
sudo apt install sbcl curl git bubblewrap
```

## Configuração

Coloque as credenciais no arquivo `.env`:

```dotenv
NVIDIA_API_KEY=nvapi-sua-chave
```

O `.env` é ignorado pelo Git, tem permissão local restrita e aparece como
`/dev/null` dentro dos terminais dos agentes.

Os dois modelos ficam em `config.sexp`:

```lisp
(:turns 6
 :agents ((:name "Laguna XS"
           :url "https://integrate.api.nvidia.com/v1/chat/completions"
           :key-env "NVIDIA_API_KEY"
           :model "poolside/laguna-xs-2.1")
          (:name "Nemotron Lightning"
           :url "https://integrate.api.nvidia.com/v1/chat/completions"
           :key-env "NVIDIA_API_KEY"
           :model "nvidia/nemotron-3.5-lightning-30b-a3b")))
```

Cada agente pode usar qualquer API compatível com o formato de chat da OpenAI.
A configuração deve conter exatamente dois agentes.

## Executando

Na raiz do projeto:

```bash
./bin/forgepair
```

Durante a execução, digite no campo `voce>` para adicionar uma observação. Ela
será entregue no próximo turno sem cancelar o modelo que já estiver trabalhando.
Use `Ctrl+C` para encerrar.

Para verificar o núcleo sem fazer requisições externas:

```bash
./bin/forgepair --self-test
```

## Definindo o trabalho

Edite `GOAL.md` antes de executar. Uma boa meta é concreta, verificável e pequena:

```markdown
# Goal

Adicione testes para o parser JSON, corrija os defeitos encontrados e preserve o
projeto sem dependências externas.
```

Depois da sessão, revise tudo:

```bash
git status
git diff
```

## Segurança

Os comandos gerados pelos modelos são executados com:

- somente este repositório gravável;
- ferramentas e bibliotecas do sistema somente para leitura;
- ambiente limpo, sem credenciais herdadas;
- `.env` mascarado por `/dev/null`;
- `.git` e `.forgepair/RULES.md` somente para leitura;
- rede desativada;
- `/tmp` e namespaces privados.

As chamadas aos provedores acontecem fora do terminal dos agentes. O modelo recebe
somente a conversa e a saída limitada dos comandos. Ainda assim, trate o projeto
como software experimental e revise as mudanças antes de aceitá-las.

## Tolerância a falhas

Endpoints gratuitos podem responder com `429` ou `503`. Forgepair tenta novamente
erros transitórios e, se um modelo continuar indisponível, registra o problema no
turno e deixa o outro modelo continuar.

O programa também aceita respostas com blocos de raciocínio, JSON cercado por
Markdown ou texto simples. Texto sem uma ação válida entra apenas como mensagem e
não executa comandos.

## Estrutura principal

```text
bin/forgepair             launcher
src/forgepair.lisp        orquestrador, TUI, HTTP, JSON e sandbox
config.sexp               agentes e quantidade de turnos
config.example.sexp       exemplo seguro de configuração
GOAL.md                   objetivo entregue aos modelos
.forgepair/RULES.md       constituição dos agentes
.env                      credenciais locais, ignoradas pelo Git
```

## Princípio zero-lib

Forgepair não usa Quicklisp, bibliotecas Lisp, SDKs de provedores, pacotes Python
ou dependências npm. Common Lisp, curl e as ferramentas básicas do sistema formam
toda a plataforma de execução.

## Protótipo legado e roadmap

O protótipo anterior em `gateway/`, `agents/`, `hooks/` e `skills/` permanece no
repositório como referência para a migração. Ele não é carregado pelo Forgepair.
A missão de transformá-lo gradualmente em Common Lisp está em `TODO.md`.
