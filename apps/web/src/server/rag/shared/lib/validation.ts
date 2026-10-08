/**
 * Validation Utilities
 * 
 * Input validation and sanitization functions.
 */

/**
 * Validates a code parameter (numeric string)
 */
export function validateCodeParam(code: unknown): { valid: boolean; value: string; error?: string } {
    if (typeof code !== 'string' || !code) {
        return { valid: false, value: '', error: 'Código é obrigatório' };
    }

    const cleaned = code.trim();

    if (!/^\d+$/.test(cleaned)) {
        return { valid: false, value: '', error: 'Código deve conter apenas números' };
    }

    return { valid: true, value: cleaned };
}

/**
 * Sanitizes a query parameter to prevent injection
 */
export function sanitizeQueryParam(param: unknown): string {
    if (typeof param !== 'string') {
        return '';
    }

    // Remove potentially dangerous characters
    return param
        .trim()
        .replace(/[<>\"'%;()&+]/g, '')
        .slice(0, 500); // Limit length
}

/**
 * Validates and formats a CPF
 */
export function validateCPF(cpf: unknown): { valid: boolean; cleaned: string; error?: string } {
    if (typeof cpf !== 'string' || !cpf) {
        return { valid: false, cleaned: '', error: 'CPF é obrigatório' };
    }

    // Remove non-numeric characters
    const cleaned = cpf.replace(/\D/g, '');

    if (cleaned.length !== 11) {
        return { valid: false, cleaned: '', error: 'CPF deve ter 11 dígitos' };
    }

    // Check for known invalid patterns (all same digits)
    if (/^(\d)\1+$/.test(cleaned)) {
        return { valid: false, cleaned: '', error: 'CPF inválido' };
    }

    // Validate check digits
    if (!isValidCPF(cleaned)) {
        return { valid: false, cleaned: '', error: 'CPF inválido' };
    }

    return { valid: true, cleaned };
}

/**
 * CPF validation algorithm
 */
function isValidCPF(cpf: string): boolean {
    // First check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf[i]) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf[9])) return false;

    // Second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf[i]) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf[10])) return false;

    return true;
}
