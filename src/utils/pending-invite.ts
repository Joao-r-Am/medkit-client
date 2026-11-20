/**
 * Token do convite pendente entre a página pública e o login/cadastro.
 *
 * Quem abre `/accept-invite/:token` sem sessão é levado ao /auth com o token
 * guardado aqui; ao concluir login ou cadastro, o fluxo de entrada consome o
 * token (aceita o convite) e o remove.
 */
export const PENDING_INVITE_TOKEN_KEY = "pending-invite-token";

export function storePendingInviteToken(token: string): void {
  window.localStorage.setItem(PENDING_INVITE_TOKEN_KEY, token);
}

export function readPendingInviteToken(): string | null {
  return window.localStorage.getItem(PENDING_INVITE_TOKEN_KEY);
}

export function clearPendingInviteToken(): void {
  window.localStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
}
