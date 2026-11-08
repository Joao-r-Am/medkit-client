import { Notify } from "quasar";

/**
 * Alerta exibido quando o usuário autenticado tenta acessar uma tela que
 * exige clínica ativa (agendamentos, pacientes, cadastros...) e é
 * redirecionado para o perfil. Chamado pelo wiring da guarda
 * (src/router/index.ts) e pelo interceptor de 403
 * CLINIC_CONTEXT_REQUIRED (src/boot/axios.ts).
 */
export function notifyClinicContextRequired(): void {
  Notify.create({
    type: "warning",
    message: "Selecione ou crie uma clínica para acessar esta tela.",
    timeout: 3000
  });
}
