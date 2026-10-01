/*
 * Stub do módulo virtual `#q-app` para os testes.
 *
 * No build do Quasar, `#q-app` é gerado em tempo de compilação e reexporta os
 * tipos/helpers do Quasar. Como não existe em disco, o vitest não consegue
 * resolver um boot file — e `src/boot/axios.ts` é justamente onde mora a
 * ponte entre as requisições e a barra de progresso.
 *
 * `defineBoot` no Quasar é apenas a identidade: recebe a função do boot file e
 * a devolve para o Quasar executar no startup. Reproduzir isso é suficiente
 * para o teste rodar o boot na mão.
 */
export const defineBoot = <T>(boot: T): T => boot;

export default {};
