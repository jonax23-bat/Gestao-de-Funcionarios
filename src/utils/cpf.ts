/**
 * Utility functions for Brazilian CPF (Cadastro de Pessoas Físicas)
 * Validation, formatting, and test generation.
 */

export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export function formatCPF(cpf: string): string {
  const digits = cleanCPF(cpf).slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function validateCPF(cpf: string): { valid: boolean; reason?: string } {
  const digits = cleanCPF(cpf);

  if (!digits) {
    return { valid: false, reason: 'CPF é obrigatório.' };
  }

  if (digits.length !== 11) {
    return { valid: false, reason: 'CPF deve conter exatamente 11 dígitos numéricos.' };
  }

  // Check for common invalid sequences (all same numbers like 11111111111, 22222222222...)
  if (/^(\d)\1{10}$/.test(digits)) {
    return { valid: false, reason: 'CPF inválido: sequência com todos os dígitos iguais.' };
  }

  // Calculate 1st verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let firstCheck = 11 - (sum % 11);
  if (firstCheck >= 10) firstCheck = 0;

  if (firstCheck !== parseInt(digits.charAt(9), 10)) {
    return { valid: false, reason: 'Primeiro dígito verificador inválido.' };
  }

  // Calculate 2nd verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  let secondCheck = 11 - (sum % 11);
  if (secondCheck >= 10) secondCheck = 0;

  if (secondCheck !== parseInt(digits.charAt(10), 10)) {
    return { valid: false, reason: 'Segundo dígito verificador inválido.' };
  }

  return { valid: true };
}

/**
 * Generates a valid random CPF number for testing purposes
 */
export function generateValidCPF(): string {
  const rnd = () => Math.floor(Math.random() * 9);
  const n: number[] = Array.from({ length: 9 }, rnd);

  // Avoid all same digits
  if (n.every((val) => val === n[0])) {
    n[0] = (n[0] + 1) % 10;
  }

  // 1st digit
  let d1 = 0;
  for (let i = 0; i < 9; i++) {
    d1 += n[i] * (10 - i);
  }
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;

  // 2nd digit
  let d2 = 0;
  for (let i = 0; i < 9; i++) {
    d2 += n[i] * (11 - i);
  }
  d2 += d1 * 2;
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;

  const raw = [...n, d1, d2].join('');
  return formatCPF(raw);
}
