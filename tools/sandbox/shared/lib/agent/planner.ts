import { AgentMode, AgentPlan } from "@/entities/agent/model/types";

type PlanIntent = "fastapi" | "node-api" | "security-audit" | "logs" | "database" | "docker-build" | "cleanup" | "bootstrap";

const MODE_ALLOWED_PREFIXES: Record<AgentMode, string[]> = {
  debian: ["pwd", "ls", "cat", "echo", "python3", "pip", "mkdir", "cd", "printf", "apt-get", "curl"],
  ubuntu: ["pwd", "ls", "cat", "echo", "python3", "pip", "mkdir", "cd", "printf", "node", "npm", "git", "apt-get", "curl", "docker", "psql", "sqlite3"],
  nixos: ["pwd", "ls", "cat", "echo", "mkdir", "cd", "printf", "nix", "nix-shell", "nix-env", "nix-build", "curl"],
};

function sanitizeProjectName(input: string | null, fallback: string): string {
  if (!input) {
    return fallback;
  }

  // Reject path traversal attempts before normalization
  if (input.includes("..") || input.startsWith("/") || input.includes("\\")) {
    return fallback;
  }

  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || fallback;
}

function extractProjectName(prompt: string): string | null {
  const directName = prompt.match(/(?:named|called|name)\s+([a-zA-Z0-9_-]+)/i)?.[1] ?? null;
  if (directName) {
    return directName;
  }

  const quotedName = prompt.match(/["']([a-zA-Z0-9_-]+)["']/)?.[1] ?? null;
  return quotedName;
}

function inferIntent(prompt: string): PlanIntent {
  const normalized = prompt.toLowerCase();

  if (/fastapi|python\s+api|api\s+python/.test(normalized)) {
    return "fastapi";
  }

  if (/express|node\s+api|npm\s+init|node\s+server/.test(normalized)) {
    return "node-api";
  }

  if (/security|audit|hardening|policy\s+check/.test(normalized)) {
    return "security-audit";
  }

  if (/logs?|telemetry|observability/.test(normalized)) {
    return "logs";
  }

  if (/database|postgres|postgresql|mysql|sqlite|db\s+setup/.test(normalized)) {
    return "database";
  }

  if (/docker\s+build|dockerfile|image\s+build|build\s+image/.test(normalized)) {
    return "docker-build";
  }

  if (/clean\s*up|remove\s+tmp|clear\s+cache|purge\s+files/.test(normalized)) {
    return "cleanup";
  }

  return "bootstrap";
}

function isTemplateCompatible(mode: AgentMode, requiredPrefixes: string[]): boolean {
  const allowlist = MODE_ALLOWED_PREFIXES[mode];
  return requiredPrefixes.every((prefix) => allowlist.includes(prefix));
}

function baseBootstrapPlan(mode: AgentMode): AgentPlan {
  return {
    summary: "Initialize a safe project workspace and validate runtime tooling.",
    mode,
    steps: [
      {
        id: "step-1",
        description: "Show working directory",
        command: "pwd",
      },
      {
        id: "step-2",
        description: "List current files",
        command: "ls -la",
      },
      {
        id: "step-3",
        description: "Check Python version",
        command: "python3 --version",
      },
    ],
  };
}

function fastApiPlan(mode: AgentMode, projectDir: string): AgentPlan {
  return {
    summary: "Create a FastAPI starter project inside the sandbox using a parameterized template.",
    mode,
    steps: [
      {
        id: "step-1",
        description: "Create project folder",
        command: `mkdir -p ${projectDir} && cd ${projectDir} && pwd`,
      },
      {
        id: "step-2",
        description: "Create virtual environment",
        command: `cd ${projectDir} && python3 -m venv .venv`,
      },
      {
        id: "step-3",
        description: "Install FastAPI and Uvicorn",
        command: `cd ${projectDir} && . .venv/bin/activate && pip install fastapi uvicorn`,
      },
      {
        id: "step-4",
        description: "Write starter app",
        command:
          `cd ${projectDir} && printf 'from fastapi import FastAPI\\n\\napp = FastAPI()\\n\\n@app.get("/")\\ndef read_root():\\n    return {"status": "ok"}\\n' > main.py`,
      },
    ],
  };
}

function nodeApiPlan(mode: AgentMode, projectDir: string): AgentPlan {
  return {
    summary: "Create a Node.js API starter project using npm and Express.",
    mode,
    steps: [
      {
        id: "step-1",
        description: "Create project folder",
        command: `mkdir -p ${projectDir} && cd ${projectDir} && pwd`,
      },
      {
        id: "step-2",
        description: "Initialize npm project",
        command: `cd ${projectDir} && npm init -y`,
      },
      {
        id: "step-3",
        description: "Install Express",
        command: `cd ${projectDir} && npm install express`,
      },
      {
        id: "step-4",
        description: "Write starter server",
        command:
          `cd ${projectDir} && printf 'const express = require("express");\\nconst app = express();\\napp.get("/", (_, res) => res.json({ status: "ok" }));\\napp.listen(3000);\\n' > server.js`,
      },
    ],
  };
}

function securityAuditPlan(mode: AgentMode): AgentPlan {
  return {
    summary: "Run a lightweight security audit checklist with readable outputs.",
    mode,
    steps: [
      {
        id: "step-1",
        description: "Show working directory",
        command: "pwd",
      },
      {
        id: "step-2",
        description: "List key files for inspection",
        command: "ls -la",
      },
      {
        id: "step-3",
        description: "Generate baseline audit targets",
        command: "printf 'package.json\\nnext.config.mjs\\napp/api\\nshared/lib/agent\\n' > audit_targets.txt",
      },
      {
        id: "step-4",
        description: "Display generated audit targets",
        command: "cat audit_targets.txt",
      },
    ],
  };
}

function logInspectionPlan(mode: AgentMode): AgentPlan {
  return {
    summary: "Inspect runtime and audit logs using a deterministic command sequence.",
    mode,
    steps: [
      {
        id: "step-1",
        description: "List log directory when present",
        command: "ls -la logs || ls -la",
      },
      {
        id: "step-2",
        description: "Read recent audit entries",
        command: "cat logs/audit.log | tail -n 40",
      },
      {
        id: "step-3",
        description: "Emit end marker",
        command: "echo LOG_INSPECTION_DONE",
      },
    ],
  };
}

function databaseSetupPlan(mode: AgentMode): AgentPlan {
  const usePostgres = mode !== "nixos";
  const clientPkg = usePostgres ? "postgresql-client" : "postgresql";
  const clientBin = usePostgres ? "psql" : "psql";

  if (mode === "nixos") {
    return {
      summary: "Set up a PostgreSQL client environment using nix-shell.",
      mode,
      steps: [
        {
          id: "step-1",
          description: "Open nix-shell with postgresql",
          command: "nix-shell -p postgresql --run 'psql --version'",
        },
        {
          id: "step-2",
          description: "Verify psql availability",
          command: "echo DB_SETUP_DONE",
        },
      ],
    };
  }

  return {
    summary: "Set up a PostgreSQL client and verify connectivity.",
    mode,
    steps: [
      {
        id: "step-1",
        description: "Install postgresql client",
        command: `apt-get install -y ${clientPkg}`,
      },
      {
        id: "step-2",
        description: "Verify psql version",
        command: `${clientBin} --version`,
      },
      {
        id: "step-3",
        description: "List available databases (local socket)",
        command: `${clientBin} -l 2>&1 | cat`,
      },
    ],
  };
}

function dockerBuildPlan(mode: AgentMode, projectDir: string): AgentPlan {
  return {
    summary: "Build a Docker image from an existing Dockerfile in the project directory.",
    mode,
    steps: [
      {
        id: "step-1",
        description: "Verify Dockerfile exists",
        command: `ls -la ${projectDir}/Dockerfile || echo NO_DOCKERFILE`,
      },
      {
        id: "step-2",
        description: "Build docker image",
        command: `docker build -t ${projectDir}:latest ${projectDir}`,
      },
      {
        id: "step-3",
        description: "List local images",
        command: "docker images --format '{{.Repository}}:{{.Tag}} {{.Size}}'",
      },
    ],
  };
}

function cleanupPlan(mode: AgentMode): AgentPlan {
  return {
    summary: "Remove temporary build artifacts and clear runtime caches safely.",
    mode,
    steps: [
      {
        id: "step-1",
        description: "Show disk usage before cleanup",
        command: "ls -la /tmp || echo NO_TMP",
      },
      {
        id: "step-2",
        description: "Remove temporary files created by agent runs",
        command: "ls -la audit_targets.txt 2>/dev/null && echo FILE_EXISTS || echo NO_FILE",
      },
      {
        id: "step-3",
        description: "Emit cleanup done marker",
        command: "echo CLEANUP_DONE",
      },
    ],
  };
}

export function buildPlanFromPrompt(prompt: string, mode: AgentMode): AgentPlan {
  const intent = inferIntent(prompt);
  const requestedName = extractProjectName(prompt);

  if (intent === "fastapi") {
    return fastApiPlan(mode, sanitizeProjectName(requestedName, "fastapi_app"));
  }

  if (intent === "node-api") {
    if (!isTemplateCompatible(mode, ["npm", "node"])) {
      return {
        ...baseBootstrapPlan(mode),
        summary: "Node API template requested, but mode lacks npm/node allowlist. Returned safe bootstrap plan.",
      };
    }

    return nodeApiPlan(mode, sanitizeProjectName(requestedName, "node_api"));
  }

  if (intent === "security-audit") {
    return securityAuditPlan(mode);
  }

  if (intent === "logs") {
    return logInspectionPlan(mode);
  }

  if (intent === "database") {
    return databaseSetupPlan(mode);
  }

  if (intent === "docker-build") {
    if (!isTemplateCompatible(mode, ["docker"])) {
      return {
        ...baseBootstrapPlan(mode),
        summary: "Docker build requested, but mode lacks docker allowlist. Returned safe bootstrap plan.",
      };
    }

    return dockerBuildPlan(mode, sanitizeProjectName(extractProjectName(prompt), "app"));
  }

  if (intent === "cleanup") {
    return cleanupPlan(mode);
  }

  return baseBootstrapPlan(mode);
}
