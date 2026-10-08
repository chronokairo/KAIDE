// WARNING: This is shared across all sector packages and must not import from any sector-specific module.
// If validation logic becomes sector-specific, split it; do not add sector-local imports here.

const CPF_BLACKLIST = new Set([
  '00000000000', '11111111111', '22222222222', '33333333333',
  '44444444444', '55555555555', '66666666666', '77777777777',
  '88888888888', '99999999999', '12345678909', '01234567890',
]);

function cleanCPF(value: string) {
  return value.replace(/\D/g, '').slice(0, 11);
}

export function cleanPhone(value: string) {
  return value.replace(/\D/g, '').slice(0, 15);
}

function isValidDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function normalizeBirthDate(value: string) {
  const raw = value.trim();
  if (!raw) return '';

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, year, month, day] = iso;
    return isValidDate(Number(year), Number(month), Number(day)) ? `${year}-${month}-${day}` : raw;
  }

  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!br) return raw;

  const [, day, month, year] = br;
  return isValidDate(Number(year), Number(month), Number(day)) ? `${year}-${month}-${day}` : raw;
}

export function validateCPF(value: string) {
  const cleaned = cleanCPF(value);
  if (cleaned.length !== 11) return 'CPF deve ter 11 digitos';
  if (CPF_BLACKLIST.has(cleaned)) return 'CPF invalido';
  if (/^(\d)\1{10}$/.test(cleaned)) return 'CPF invalido';

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cleaned[index]) * (10 - index);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== Number(cleaned[9])) return 'CPF invalido';

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cleaned[index]) * (11 - index);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== Number(cleaned[10])) return 'CPF invalido';

  return '';
}

export function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Email invalido';
}

export function validatePhone(value: string) {
  const cleaned = cleanPhone(value);
  if (cleaned.length < 10) return 'Telefone deve conter DDD e numero';
  if (cleaned.length > 13) return 'Telefone invalido';
  return '';
}

export function validateBirthDate(value: string) {
  const normalizedValue = normalizeBirthDate(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) return 'Data de nascimento invalida';

  const [year, month, day] = normalizedValue.split('-').map(Number);
  if (!isValidDate(year, month, day)) return 'Data de nascimento invalida';

  const birthDate = new Date(Date.UTC(year, month - 1, day));
  const now = new Date();
  const age = now.getUTCFullYear() - birthDate.getUTCFullYear() -
    (now.getUTCMonth() < birthDate.getUTCMonth() ||
    (now.getUTCMonth() === birthDate.getUTCMonth() && now.getUTCDate() < birthDate.getUTCDate())
      ? 1 : 0);
  if (age < 14) return 'Idade minima para prosseguir e 14 anos';
  if (age > 120) return 'Data de nascimento invalida';

  return '';
}
