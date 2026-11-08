/**
 * Rotas públicas (sem token): login e cadastro.
 * `/to-schedule/<token>` é o autoagendamento público por link.
 */
export const PUBLIC_PATHS = ["/login", "/auth"];
export const PUBLIC_PREFIXES = ["/to-schedule/"];

/**
 * Rotas de conta: autenticadas, mas que não exigem clínica ativa.
 * São a única área navegável até o usuário criar/ser convidado
 * para uma clínica (o contexto ativo é validado aqui também).
 */
export const NO_CLINIC_PATHS = ["/clinics", "/profile"];

export type NavigationGuardInput = {
  path: string;
  hasToken: boolean;
  hasClinicContext: boolean;
};

/**
 * Lógica pura da guarda de navegação, para ser testável sem montar
 * o router completo (rotas de arquivo via vue-router/auto-routes).
 */
export function resolveNavigationGuard({
  path,
  hasToken,
  hasClinicContext
}: NavigationGuardInput): string | undefined {
  const isBookingLink = path.startsWith("/to-schedule/");
  const isPublic =
    PUBLIC_PATHS.includes(path) ||
    (!isBookingLink && PUBLIC_PREFIXES.some(prefix => path.startsWith(prefix)));

  if (isBookingLink) {
    return undefined;
  }

  if (isPublic && hasToken) {
    return "/";
  }

  if (!isPublic && !hasToken) {
    return "/auth";
  }

  // Sem contexto de clínica, o usuário só acessa as rotas de conta
  // (lista de clínicas e perfil, com a aba de criação de clínica).
  if (hasToken && !hasClinicContext && !NO_CLINIC_PATHS.includes(path)) {
    return "/profile";
  }

  return undefined;
}
