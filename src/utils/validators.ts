type ValidationResult = true | string;

export function validateEmptyAndLength3(
  value: string | undefined
): ValidationResult {
  if (!value) {
    return "*Este campo é obrigatório";
  }

  if (value.length < 3) {
    return "*Este campo precisa de no mínimo 3 caracteres";
  }

  return true;
}

export function validateEmpty(value: string | undefined): ValidationResult {
  if (!value) {
    return "*Este campo é obrigatório";
  }
  return true;
}

export function validateEmptyAndEmail(
  value: string | undefined
): ValidationResult {
  if (!value) {
    return "*Este campo é obrigatório";
  }

  const isEmail = /^[a-z0-9.]+@[a-z0-9]+\.[a-z]+(\.[a-z]+)?$/i.test(value);

  if (!isEmail) {
    return "*Este campo precisa ser um e-mail";
  }

  return true;
}

export function validateEmailOrDocument(
  value: string | undefined
): ValidationResult {
  if (!value) {
    return "*Informe seu e-mail ou CPF/CNPJ";
  }

  const trimmed = value.trim();

  if (trimmed.includes("@")) {
    return validateEmptyAndEmail(trimmed);
  }

  return validateDocument(trimmed);
}

export function validateOptionalEmail(
  value: string | undefined
): ValidationResult {
  if (!value) {
    return true;
  }

  const isEmail = /^[a-z0-9.]+@[a-z0-9]+\.[a-z]+(\.[a-z]+)?$/i.test(value);

  if (!isEmail) {
    return "*Este campo precisa ser um e-mail";
  }

  return true;
}

function isValidCPF(digits: string): boolean {
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]!) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[9]!)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]!) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[10]!)) return false;

  return true;
}

function isValidCNPJ(digits: string): boolean {
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]!) * w1[i]!;
  let rest = sum % 11;
  if (rest < 2) rest = 0;
  else rest = 11 - rest;
  if (rest !== parseInt(digits[12]!)) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i]!) * w2[i]!;
  rest = sum % 11;
  if (rest < 2) rest = 0;
  else rest = 11 - rest;
  if (rest !== parseInt(digits[13]!)) return false;

  return true;
}

export function formatDocument(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{4})/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function stripDocumentFormatting(value: string): string {
  return value.replace(/\D/g, "");
}

export function validateDocument(value: string): ValidationResult {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11) {
    if (!isValidCPF(digits)) return "*CPF inválido";
    return true;
  }

  if (digits.length === 14) {
    if (!isValidCNPJ(digits)) return "*CNPJ inválido";
    return true;
  }

  return "*Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos";
}

export function validateSelection(value: unknown): ValidationResult {
  if (!value) {
    return "*Selecione uma opção";
  }

  return true;
}

export function validateDateNotPast(value: unknown): ValidationResult {
  if (!value) {
    return "*Selecione uma data";
  }

  const date = new Date(value as string);

  if (isNaN(date.getTime())) {
    return "*Data inválida";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date.getTime() < today.getTime()) {
    return "*A data não pode ser no passado";
  }

  return true;
}

export function validateTime(value: unknown): ValidationResult {
  if (!value) {
    return "*Informe o horário";
  }

  return true;
}
