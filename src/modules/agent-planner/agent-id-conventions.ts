/**
 * ESLint rules for data-agent-id conventions
 * 
 * Validates format, uniqueness, and proper usage of data-agent-id attributes
 */

// @ts-expect-error - eslint types not available in this project
import { Rule } from 'eslint';
// @ts-expect-error - vue-eslint-parser not available in this project
import { AST } from 'vue-eslint-parser';

// Regex para validar formato do data-agent-id
const AGENT_ID_FORMAT = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)*$/;

// Módulos conhecidos para validação
const KNOWN_MODULES = new Set([
  'auth', 'student', 'course', 'finance', 'admin', 'report', 'settings',
  'nav', 'modal', 'form', 'input', 'button', 'table', 'list', 'search',
  'filter', 'sort', 'export', 'import', 'create', 'edit', 'delete', 'view',
  'submit', 'cancel', 'confirm', 'save', 'reset', 'refresh', 'download',
  'upload', 'copy', 'move', 'archive', 'restore', 'activate', 'deactivate'
]);

// Ações conhecidas para validação
const KNOWN_ACTIONS = new Set([
  'create', 'edit', 'delete', 'view', 'submit', 'cancel', 'confirm', 'save',
  'reset', 'refresh', 'download', 'upload', 'copy', 'move', 'archive',
  'restore', 'activate', 'deactivate', 'open', 'close', 'show', 'hide',
  'search', 'filter', 'sort', 'export', 'import', 'login', 'logout',
  'register', 'enroll', 'pay', 'print', 'send', 'receive', 'approve',
  'reject', 'start', 'stop', 'pause', 'resume'
]);

// Entidades conhecidas para validação
const KNOWN_ENTITIES = new Set([
  'form', 'input', 'button', 'link', 'modal', 'dialog', 'table', 'list',
  'row', 'cell', 'header', 'footer', 'menu', 'submenu', 'item', 'option',
  'tab', 'panel', 'section', 'article', 'aside', 'nav', 'main', 'header',
  'footer', 'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'img', 'video', 'audio', 'canvas', 'svg', 'select', 'textarea',
  'checkbox', 'radio', 'file', 'date', 'time', 'number', 'email',
  'password', 'tel', 'url', 'search', 'color', 'range'
]);

export const agentIdFormatRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce proper format for data-agent-id attributes',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/ciesa/educacional/docs/convencoes-agent-id.md'
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          ignorePatterns: {
            type: 'array',
            items: { type: 'string' },
            description: 'Patterns to ignore during validation'
          },
          requireKnownModules: {
            type: 'boolean',
            default: false,
            description: 'Require modules to be from known list'
          }
        },
        additionalProperties: false
      }
    ]
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const options = context.options[0] || {};
    const ignorePatterns = options.ignorePatterns || [];
    const requireKnownModules = options.requireKnownModules || false;

    function shouldIgnore(agentId: string): boolean {
      return ignorePatterns.some((pattern: string) => agentId.includes(pattern));
    }

    function validateFormat(agentId: string): { valid: boolean; message?: string } {
      if (shouldIgnore(agentId)) {
        return { valid: true };
      }

      if (!AGENT_ID_FORMAT.test(agentId)) {
        return {
          valid: false,
          message: `Invalid format. Expected: [modulo].[acao].[entidade] with lowercase letters, numbers, and dots only`
        };
      }

      const parts = agentId.split('.');
      
      if (parts.length < 2) {
        return {
          valid: false,
          message: 'Must contain at least 2 parts separated by dots (modulo.entidade minimum)'
        };
      }

      if (parts.length > 4) {
        return {
          valid: false,
          message: 'Should not exceed 4 parts (modulo.acao.entidade.qualificador)'
        };
      }

      const [module, action, entity] = parts;

      if (requireKnownModules && !KNOWN_MODULES.has(module)) {
        return {
          valid: false,
          message: `Unknown module "${module}". Known modules: ${Array.from(KNOWN_MODULES).join(', ')}`
        };
      }

      if (!KNOWN_ACTIONS.has(action) && parts.length >= 3) {
        return {
          valid: false,
          message: `Unknown action "${action}". Known actions: ${Array.from(KNOWN_ACTIONS).join(', ')}`
        };
      }

      if (entity && !KNOWN_ENTITIES.has(entity) && parts.length >= 3) {
        return {
          valid: false,
          message: `Unknown entity "${entity}". Known entities: ${Array.from(KNOWN_ENTITIES).join(', ')}`
        };
      }

      return { valid: true };
    }

    function checkNode(node: any): void {
      if (!node.attributes) return;

      const agentIdAttr = node.attributes.find((attr: any) => attr.key === 'data-agent-id');
      if (!agentIdAttr) return;

      const agentId = agentIdAttr.value?.value;
      if (!agentId) return;

      const validation = validateFormat(agentId);
      if (!validation.valid) {
        context.report({
          node,
          message: `Invalid data-agent-id "${agentId}": ${validation.message}`,
          fix(fixer: any) {
            if (agentIdAttr.value?.range) {
              // Tentar corrigir formato simples (conversão para lowercase e substituição de hífens)
              const fixedId = agentId
                .toLowerCase()
                .replace(/[^a-z0-9.]/g, '.')
                .replace(/\.+/g, '.')
                .replace(/^\.|\.+$/g, '');
              
              return fixer.replaceTextRange(agentIdAttr.value.range, fixedId);
            }
            return null;
          }
        });
      }
    }

    return {
      'VElement[name="button"], VElement[name="input"], VElement[name="form"], VElement[name="a"], VElement[name="div"], VElement[name="span"]': checkNode,
      'VElement[name="button"], VElement[name="input"], VElement[name="form"], VElement[name="a"], VElement[name="div"], VElement[name="span"] > VAttribute[key="data-agent-id"]': checkNode
    };
  }
};

export const agentIdUniquenessRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce uniqueness of data-agent-id attributes within the same file',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/ciesa/educacional/docs/convencoes-agent-id.md'
    },
    fixable: null,
    schema: []
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const agentIds = new Map<string, { node: any; line: number; column: number }>();

    function checkNode(node: any): void {
      if (!node.attributes) return;

      const agentIdAttr = node.attributes.find((attr: any) => attr.key === 'data-agent-id');
      if (!agentIdAttr) return;

      const agentId = agentIdAttr.value?.value;
      if (!agentId) return;

      if (agentIds.has(agentId)) {
        const existing = agentIds.get(agentId)!;
        context.report({
          node,
          message: `Duplicate data-agent-id "${agentId}". Already used at line ${existing.line}, column ${existing.column}`,
          loc: node.loc?.start
        });
      } else {
        agentIds.set(agentId, {
          node,
          line: node.loc?.start.line || 0,
          column: node.loc?.start.column || 0
        });
      }
    }

    return {
      'VElement': checkNode
    };
  }
};

export const agentIdRequiredRule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Suggest adding data-agent-id to critical interactive elements',
      category: 'Best Practices',
      recommended: false,
      url: 'https://github.com/ciesa/educacional/docs/convencoes-agent-id.md'
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          requireForButtons: {
            type: 'boolean',
            default: true,
            description: 'Require data-agent-id for button elements'
          },
          requireForInputs: {
            type: 'boolean',
            default: true,
            description: 'Require data-agent-id for input elements'
          },
          requireForLinks: {
            type: 'boolean',
            default: false,
            description: 'Require data-agent-id for link elements'
          }
        },
        additionalProperties: false
      }
    ]
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const options = context.options[0] || {};
    const requireForButtons = options.requireForButtons !== false;
    const requireForInputs = options.requireForInputs !== false;
    const requireForLinks = options.requireForLinks === true;

    function checkNode(node: any): void {
      if (!node.attributes) return;

      const hasAgentId = node.attributes.some((attr: any) => attr.key === 'data-agent-id');
      if (hasAgentId) return;

      const tagName = node.name?.toLowerCase();
      
      // Verificar se é um elemento crítico que deveria ter data-agent-id
      const shouldHaveId = 
        (requireForButtons && tagName === 'button') ||
        (requireForInputs && tagName === 'input') ||
        (requireForLinks && tagName === 'a');

      if (!shouldHaveId) return;

      // Verificar se tem texto ou aria-label para determinar se é importante
      let hasContent = false;
      if (node.children && node.children.length > 0) {
        hasContent = node.children.some((child: any) => 
          child.type === 'VText' && child.value?.trim()
        );
      }

      const ariaLabel = node.attributes.find((attr: any) => attr.key === 'aria-label');
      if (ariaLabel?.value?.value) {
        hasContent = true;
      }

      if (!hasContent) return;

      // Sugerir ID baseado no contexto
      let suggestedId = '';
      if (tagName === 'button') {
        const text = node.children?.find((child: any) => child.type === 'VText')?.value?.trim() || '';
        if (text) {
          const action = text.toLowerCase().includes('cancelar') ? 'cancel' : 
                         text.toLowerCase().includes('excluir') ? 'delete' :
                         text.toLowerCase().includes('editar') ? 'edit' :
                         text.toLowerCase().includes('salvar') ? 'save' :
                         text.toLowerCase().includes('entrar') ? 'login' :
                         text.toLowerCase().includes('cadastrar') ? 'register' :
                         'submit';
          suggestedId = `form.${action}.button`;
        }
      } else if (tagName === 'input') {
        const typeAttr = node.attributes.find((attr: any) => attr.key === 'type');
        const inputType = typeAttr?.value?.value || 'text';
        const nameAttr = node.attributes.find((attr: any) => attr.key === 'name');
        const inputName = nameAttr?.value?.value || inputType;
        suggestedId = `form.input.${inputName}`;
      }

      context.report({
        node,
        message: `Consider adding data-agent-id to this ${tagName} element${suggestedId ? ` (suggested: "${suggestedId}")` : ''}`,
        data: {
          suggestedId
        }
      });
    }

    return {
      'VElement[name="button"]': checkNode,
      'VElement[name="input"]': checkNode,
      'VElement[name="a"]': checkNode
    };
  }
};

export const agentIdNoDeprecatedRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent use of deprecated data-agent-id patterns',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/ciesa/educacional/docs/convencoes-agent-id.md'
    },
    fixable: 'code',
    schema: []
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const deprecatedPatterns = [
      /button\d+/i,           // button1, button2
      /input\d+/i,            // input1, input2
      /btn-/i,                // btn-submit, btn-cancel
      /_/g,                    // underscore separator
      /[A-Z]/,                // uppercase letters
      /-{2,}/,                // multiple dashes
      /^test/i,               // test IDs
      /^temp/i,               // temporary IDs
      /^demo/i                // demo IDs
    ];

    function checkNode(node: any): void {
      if (!node.attributes) return;

      const agentIdAttr = node.attributes.find((attr: any) => attr.key === 'data-agent-id');
      if (!agentIdAttr) return;

      const agentId = agentIdAttr.value?.value;
      if (!agentId) return;

      for (const pattern of deprecatedPatterns) {
        if (pattern.test(agentId)) {
          context.report({
            node,
            message: `Deprecated data-agent-id pattern detected: "${agentId}". Use format [modulo].[acao].[entidade] instead.`,
            fix(fixer: any) {
              if (agentIdAttr.value?.range) {
                // Tentar converter para formato válido
                let fixedId = agentId
                  .toLowerCase()
                  .replace(/_/g, '.')
                  .replace(/btn-/g, 'button.')
                  .replace(/button\d+/g, 'button.submit')
                  .replace(/input\d+/g, 'input.text')
                  .replace(/-{2,}/g, '.')
                  .replace(/[^a-z0-9.]/g, '.')
                  .replace(/\.+/g, '.')
                  .replace(/^\.|\.+$/g, '');

                return fixer.replaceTextRange(agentIdAttr.value.range, fixedId);
              }
              return null;
            }
          });
          break;
        }
      }
    }

    return {
      'VElement': checkNode
    };
  }
};

// Configuração do plugin
export default {
  rules: {
    '@ciesa/agent-id-format': agentIdFormatRule,
    '@ciesa/agent-id-uniqueness': agentIdUniquenessRule,
    '@ciesa/agent-id-required': agentIdRequiredRule,
    '@ciesa/agent-id-no-deprecated': agentIdNoDeprecatedRule
  }
};
