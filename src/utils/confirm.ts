import { Dialog } from "quasar";

/**
 * Diálogo de confirmação de exclusão (substitui o componente DeleteConfirm).
 * Resolve `true` quando o usuário confirmar.
 */
export function confirmDelete(
  message = "Esta ação não pode ser desfeita."
): Promise<boolean> {
  return new Promise(resolve => {
    Dialog.create({
      title: "Confirmar exclusão",
      message,
      ok: {
        label: "Excluir",
        color: "negative",
        unelevated: true,
        noCaps: true
      },
      cancel: { label: "Cancelar", flat: true, noCaps: true },
      persistent: true
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false))
      .onDismiss(() => resolve(false));
  });
}
