import { ref } from "vue";

/*
 * Indicador de carregamento global, no padrão da barra do topo do YouTube.
 *
 * `requests` conta as requisições em voo e é quem mantém a barra visível.
 * Quem alimenta é o interceptor do axios (src/boot/axios.ts) — a navegação
 * entre páginas dispara o prefetch em background e a barra acende no clique,
 * enquanto a página de destino mostra o skeleton até o dado chegar.
 *
 * O contador é número, e não booleano, porque as páginas disparam várias
 * requisições concorrentes (Promise.all em appointments.vue) e um booleano
 * apagaria a barra assim que a primeira respondesse.
 */

/*
 * Quanto da barra já foi preenchido, de 0 a 1.
 *
 * A origem do número é byte real, não um temporizador fingindo progresso: o
 * interceptor do axios anexa `onDownloadProgress` e cada requisição em voo
 * informa quanto já chegou e quanto vem. A barra é a razão somada de todos os
 * downloads concorrentes:
 *
 *     sumLoaded = Σ loaded
 *     sumTotal  = Σ total        (apenas os com total conhecido)
 *     raw       = sumLoaded / sumTotal
 *
 * Três defesas, porque a razão bruta sozinha mente em três situações reais:
 *
 *  1. PISO MONOTÔNICO — uma requisição que entra no meio do carregamento
 *     aumenta o denominador, então a razão *cai* e a barra andaria para trás.
 *     `progress` só avança, nunca retrocede.
 *
 *  2. TETO DE 95% — sem ele, uma requisição tardia poderia deixar a barra em
 *     100% enquanto ainda havia dado chegando, que é o pior erro visual
 *     possível. Os 5% finais completam quando tudo assenta.
 *
 *  3. TOTAL DESCONHECIDO — o axios entrega `total: undefined` quando a
 *     resposta não é `lengthComputable` (sem `Content-Length`). Essa requisição
 *     não entra na divisão e só pesa quando termina, evitando um denominador
 *     inventado. A API sempre envia `Content-Length`, então isso é rede de
 *     segurança: bufferização, proxy ou resposta em streaming.
 *
 * Uma consequência boa do item 3: o `total` chega junto com os headers, e em
 * requisições paralelas todos os headers chegam antes de qualquer corpo
 * completar. É por isso que a fração da operação inteira fica conhecida cedo e
 * a barra anda de forma consistente.
 */
const MAX_BEFORE_SETTLED = 0.95;

/*
 * Tempo que a barra fica visível depois de aparecer, mesmo que o dado tenha
 * chegado antes. Sem isso a barra some em um frame e ninguém a enxerga.
 *
 * 400ms porque com 250 a barra "pisca" em API rápida: aparece, dá um pulo e
 * some antes de o cérebro registrar movimento. 400 dá presença sem atrasar a
 * sensação de término — e acompanha o sweep indeterminate do AppProgressBar.
 *
 * Não há delay de aparição: qualquer trabalho — inclusive uma troca de aba que
 * resolve no cache, sem byte nenhum — acende a barra de imediato.
 *
 * Exportada porque os specs avançam o relógio por este valor: usar o número
 * real do store evita que teste e implementação divergam silenciosamente.
 */
export const MIN_DISPLAY_MS = 400;

type Transfer = {
  loaded: number;
  total: number | undefined;
  done: boolean;
};

const requests = ref(0);
const isLoading = ref(false);
const progress = ref(0);

let transfers = new Map<number, Transfer>();
let nextId = 0;
let shownAt = 0;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

export function useGlobalLoading() {
  return { isLoading, progress };
}

function isBusy() {
  return requests.value > 0;
}

function show() {
  if (isLoading.value) return;

  isLoading.value = true;
  shownAt = Date.now();
}

function scheduleHide() {
  if (!isLoading.value) return;

  const remaining = Math.max(0, MIN_DISPLAY_MS - (Date.now() - shownAt));
  if (hideTimer) clearTimeout(hideTimer);

  hideTimer = setTimeout(() => {
    hideTimer = undefined;
    isLoading.value = false;
  }, remaining);
}

function settle() {
  if (isBusy()) return;
  scheduleHide();
}

/** Recalcula a fração a partir dos bytes recebidos de todas as requisições. */
function recompute() {
  let sumLoaded = 0;
  let sumTotal = 0;

  transfers.forEach(transfer => {
    // Uma transferência sem total conhecido NÃO entra na divisão: somar os
    // bytes no numerador sem o total correspondente no denominador faria a
    // razão passar de 1 e a barra estourar. O total é inferido do `loaded`
    // quando a requisição termina (ver `stopRequest`).
    if (transfer.total === undefined || transfer.total <= 0) return;

    sumLoaded += transfer.loaded;
    sumTotal += transfer.total;
  });

  if (sumTotal === 0) return;

  const raw = Math.min(sumLoaded / sumTotal, MAX_BEFORE_SETTLED);

  // Piso monotônico: o denominador pode crescer no meio do carregamento, mas a
  // barra jamais recua.
  if (raw > progress.value) progress.value = raw;
}

/**
 * Uma requisição HTTP entrou em voo. Usado pelo interceptor do axios.
 * Devolve o identificador que identifica a transferência nos bytes e no fim.
 */
export function startRequest(): number {
  // Só uma operação nova zera a barra. Uma requisição que entra no meio de um
  // carregamento em andamento encontra o progresso já adiantado; se zerasse
  // aqui, a barra voltaria ao começo — que é exatamente o salto retrógrado que
  // o piso monotônico existe para impedir.
  if (requests.value === 0) {
    progress.value = 0;
    transfers = new Map();
  }

  requests.value++;
  show();

  const id = ++nextId;
  transfers.set(id, { loaded: 0, total: undefined, done: false });

  return id;
}

/** Bytes recebidos de uma requisição em voo. */
export function reportBytes(
  id: number,
  loaded: number,
  total: number | undefined
) {
  const transfer = transfers.get(id);
  if (!transfer) return;

  transfer.loaded = loaded;
  transfer.total = total;

  recompute();
}

export function stopRequest(id?: number) {
  let transfer = id !== undefined ? transfers.get(id) : undefined;

  // Sem id utilizável — tipicamente um erro que chegou sem `config` — não há
  // como saber qual requisição era. Descartar a em voo mais antiga evita que o
  // contador vaze: um vazamento aqui deixaria a barra travada para sempre.
  if (!transfer) {
    for (const [chave, candidato] of transfers) {
      if (!candidato.done) {
        transfer = candidato;
        id = chave;
        break;
      }
    }
  }

  if (!transfer) return;

  // Terminou sem `Content-Length`: agora o tamanho é conhecido (é o que
  // chegou), e a transferência passa a valer 100% na fração.
  if (transfer.total === undefined) transfer.total = transfer.loaded;

  // Fica no registro, marcada como concluída, para que os bytes que ela
  // trouxe continuem contando no total da operação.
  transfer.done = true;
  requests.value = Math.max(0, requests.value - 1);

  // A última requisição da operação é o único momento em que 100% é verdade:
  // nenhuma outra transferência pode aumentar o total depois disso. E é
  // também o momento de liberar o registro.
  if (requests.value === 0) {
    progress.value = 1;
    transfers = new Map();
  }

  settle();
}
