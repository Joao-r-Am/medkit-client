import { Notify } from "quasar";

function extractErrorMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    const maybeMessage = (err as Record<string, unknown>).message;
    if (typeof maybeMessage === "string") return maybeMessage;

    const axiosError = err as { response?: { data?: { message?: string } } };
    const apiMessage = axiosError.response?.data?.message;
    if (typeof apiMessage === "string") return apiMessage;
  }
  return undefined;
}

type ToastyContent = { title: string; msg?: string };

export const successToasty = ({ title, msg }: ToastyContent) => {
  Notify.create({
    type: "positive",
    message: title,
    caption: msg ?? "",
    timeout: 3000
  });
};

export const errorToasty = ({ title, msg }: ToastyContent, err?: unknown) => {
  Notify.create({
    type: "negative",
    message: title,
    caption: extractErrorMessage(err) ?? msg ?? "",
    timeout: 3000
  });
};

export const warnToasty = ({ title, msg }: ToastyContent) => {
  Notify.create({
    type: "warning",
    message: title,
    caption: msg ?? "",
    timeout: 3000
  });
};

export const infoToasty = ({ title, msg }: ToastyContent) => {
  Notify.create({
    type: "info",
    message: title,
    caption: msg ?? "",
    timeout: 3000
  });
};

export const removeAll = () => {
  // Quasar não mantém grupos de toasts; mantido por compatibilidade de chamadas.
};

const toasty = {
  successToasty,
  errorToasty,
  warnToasty,
  infoToasty,
  removeAll
};

export default toasty;
