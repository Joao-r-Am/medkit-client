import type { AxiosResponse } from "axios";

export type ServiceError = {
  status: number;
  statusText: string;
} | null;

/**
 * Extrai o erro a partir de uma resposta resolvida (padrão do projeto original:
 * services retornam { data, error } em vez de lançar exceções).
 */
export function buildError(response: AxiosResponse): ServiceError {
  const request = response?.request as
    | { status?: number; statusText?: string }
    | undefined;

  if (!response?.data || !request?.status) {
    return null;
  }

  // Resposta resolvida com corpo vazio indica falha não mapeada pela API.
  const isEmptyBody =
    response.data === null ||
    response.data === undefined ||
    (typeof response.data === "object" &&
      Object.keys(response.data).length === 0);

  if (!isEmptyBody) {
    return null;
  }

  return {
    status: request.status,
    statusText: request.statusText ?? ""
  };
}
