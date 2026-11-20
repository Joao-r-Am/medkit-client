/** Rótulos pt-BR dos papéis de sistema. */
const ROLE_LABELS: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  professional: "Profissional",
  operator: "Operador"
};

export function roleLabel(name: string): string {
  return ROLE_LABELS[name] ?? name;
}
