/** Código de erro normalizado devolvido pela API (response.data.code). */
export function errorCodeOf(error: unknown): string {
  return (
    (error as { response?: { data?: { code?: string } } }).response?.data
      ?.code ?? ""
  );
}

/** Status HTTP da resposta de erro (0 quando não há resposta). */
export function errorStatusOf(error: unknown): number {
  return (error as { response?: { status?: number } }).response?.status ?? 0;
}
