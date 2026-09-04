<template>
  <div class="app-auth">
    <!-- Header -->
    <header class="app-auth__header">
      <q-btn
        unelevated
        no-caps
        to="/login"
        label="Acessar"
        class="app-btn-primary"
      />
      <div class="app-auth__logo" style="width: 160px; max-width: 50%">
        <img
          :src="logoUrl"
          alt="MedKit"
          style="display: block; width: 100%; height: auto"
        />
      </div>
    </header>

    <!-- Hero com carrossel -->
    <section class="app-auth__section">
      <div class="app-hero">
        <q-carousel
          v-model="slide"
          animated
          infinite
          :autoplay="6000"
          control-color="amber-4"
          class="app-hero__carousel"
          height="auto"
        >
          <q-carousel-slide
            v-for="(item, i) in slides"
            :key="i"
            :name="String(i)"
            class="app-hero__slide"
          >
            <span class="app-hero__eyebrow">{{ item.eyebrow }}</span>
            <h2 class="app-hero__title">{{ item.title }}</h2>
            <p class="app-hero__description">{{ item.description }}</p>
            <ul class="app-hero__points">
              <li v-for="point in item.points" :key="point">
                <i class="fa-solid fa-circle-check"></i>
                {{ point }}
              </li>
            </ul>
          </q-carousel-slide>

          <template #control>
            <q-carousel-control position="bottom">
              <div class="row justify-center q-gutter-xs q-pb-md">
                <button
                  v-for="(item, i) in slides"
                  :key="i"
                  type="button"
                  :class="[
                    'app-hero__dot',
                    { 'app-hero__dot--active': slide === String(i) }
                  ]"
                  :aria-label="`Slide ${i + 1}`"
                  @click="slide = String(i)"
                />
              </div>
            </q-carousel-control>
          </template>
        </q-carousel>
      </div>
    </section>

    <!-- Pacientes -->
    <section class="app-auth__section app-auth__features">
      <div class="app-section-label">Pacientes</div>
      <h2 class="app-section-title">Tudo sobre quem você atende</h2>
      <p class="app-section-description">
        Do cadastro ao histórico clínico, em um só lugar.
      </p>

      <div class="app-feature-grid">
        <div
          v-for="item in patientFeatures"
          :key="item.title"
          class="app-feature-card"
        >
          <div class="app-feature-card__icon" :class="item.tone">
            <i :class="item.icon"></i>
          </div>
          <div class="row items-center q-gutter-x-xs">
            <h3 class="app-feature-card__title">{{ item.title }}</h3>
            <span v-if="item.dev" class="app-feature-card__dev">
              Em desenvolvimento
            </span>
          </div>
          <p class="app-feature-card__description">{{ item.description }}</p>
        </div>
      </div>
    </section>

    <!-- Agendamentos (seção destaque) -->
    <section class="app-auth__section app-highlight">
      <div class="app-section-label app-section-label--light">Agendamentos</div>
      <h2 class="app-section-title app-section-title--light">
        Agendamentos conectados ao WhatsApp
      </h2>
      <p class="app-section-description app-section-description--light">
        Agendamentos automatizados que conversam com seus pacientes — menos
        erros, mais retornos.
      </p>

      <div class="row q-col-gutter-lg q-mt-lg">
        <div
          v-for="card in highlightCards"
          :key="card.title"
          class="col-12 col-md-4"
        >
          <div class="app-highlight__card">
            <i :class="card.icon" class="text-h5 text-weight-bold"></i>
            <h3 class="app-feature-card__title q-mt-sm">{{ card.title }}</h3>
            <p class="app-feature-card__description q-mt-xs">
              {{ card.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Financeiro -->
    <section class="app-auth__section app-auth__features">
      <div class="app-section-label">Financeiro</div>
      <h2 class="app-section-title">Faturamento sem complicação</h2>
      <p class="app-section-description">
        Controle de cobranças, notas e recebimentos em poucos cliques.
      </p>

      <div class="app-feature-grid">
        <div
          v-for="item in billingFeatures"
          :key="item.title"
          class="app-feature-card"
        >
          <div class="app-feature-card__icon" :class="item.tone">
            <i :class="item.icon"></i>
          </div>
          <div class="row items-center q-gutter-x-xs">
            <h3 class="app-feature-card__title">{{ item.title }}</h3>
            <span v-if="item.dev" class="app-feature-card__dev">
              Em desenvolvimento
            </span>
          </div>
          <p class="app-feature-card__description">{{ item.description }}</p>
        </div>
      </div>
    </section>

    <!-- Cadastros gerais -->
    <section class="app-auth__section app-auth__features">
      <div class="app-section-label">Cadastros gerais</div>
      <h2 class="app-section-title">Base padronizada e sempre à mão</h2>
      <p class="app-section-description">
        Códigos e tabelas que alimentam toda a operação da clínica.
      </p>

      <div class="app-feature-grid app-feature-grid--three">
        <div
          v-for="item in registryFeatures"
          :key="item.title"
          class="app-feature-card"
        >
          <div class="app-feature-card__icon" :class="item.tone">
            <i :class="item.icon"></i>
          </div>
          <div class="row items-center q-gutter-x-xs">
            <h3 class="app-feature-card__title">{{ item.title }}</h3>
            <span v-if="item.dev" class="app-feature-card__dev">
              Em desenvolvimento
            </span>
          </div>
          <p class="app-feature-card__description">{{ item.description }}</p>
        </div>
      </div>
    </section>

    <!-- Agenda médica -->
    <section class="app-auth__section app-auth__features">
      <div class="app-section-label">Agenda médica</div>
      <h2 class="app-section-title">Uma agenda que se adapta à sua rotina</h2>
      <p class="app-section-description">
        Visualize o dia de cada profissional do jeito que fizer sentido para
        você.
      </p>

      <div class="app-feature-grid app-feature-grid--two">
        <div
          v-for="item in agendaFeatures"
          :key="item.title"
          class="app-feature-card"
        >
          <div class="app-feature-card__icon" :class="item.tone">
            <i :class="item.icon"></i>
          </div>
          <div class="row items-center q-gutter-x-xs">
            <h3 class="app-feature-card__title">{{ item.title }}</h3>
            <span v-if="item.dev" class="app-feature-card__dev">
              Em desenvolvimento
            </span>
          </div>
          <p class="app-feature-card__description">{{ item.description }}</p>
        </div>
      </div>
    </section>

    <!-- Contato / CTA -->
    <section class="app-auth__section">
      <div class="app-contact">
        <h2 class="app-contact__title">Pronto para organizar sua clínica?</h2>
        <p class="app-contact__description">
          Comece hoje mesmo e tenha pacientes, agenda e faturamento em um só
          lugar.
        </p>
        <div class="row justify-center q-gutter-md q-mt-lg">
          <q-btn
            unelevated
            no-caps
            size="lg"
            to="/login"
            label="Criar conta grátis"
            class="app-btn-primary"
          />
          <q-btn
            outline
            no-caps
            size="lg"
            href="mailto:contato@medkit.com.br"
            label="Falar com a gente"
            class="app-btn-outline"
          />
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="app-footer-dark">
      <div class="app-footer-dark__inner">
        <div class="column items-center on-left-sm items-start-sm">
          <div class="row items-center q-gutter-x-sm">
            <img
              :src="logoSmallUrl"
              alt="MedKit"
              style="width: 28px; opacity: 0.9"
            />
            <span class="text-h6 text-weight-bolder app-footer-dark__brand">
              MedKit
            </span>
          </div>
          <p class="app-footer-dark__tagline">
            Gestão para clínicas e profissionais da saúde
          </p>
          <p class="app-footer-dark__copy">
            &copy; 2026 MedKit. Todos os direitos reservados.
          </p>
        </div>

        <div class="column items-center items-end-sm q-gutter-y-sm">
          <span class="app-footer-dark__social-label">Siga a gente</span>
          <div class="row q-gutter-sm">
            <a
              v-for="social in socials"
              :key="social.name"
              :href="social.href"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="social.name"
              class="app-footer-dark__social"
            >
              <i :class="social.icon"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import logoUrl from "@/assets/images/logo.svg";
import logoSmallUrl from "@/assets/images/logo-small.png";

defineOptions({ name: "AuthPage" });

const router = useRouter();
const userStore = useUserStore();

const slide = ref("0");

const socials = [
  { name: "Instagram", icon: "fa-brands fa-instagram", href: "#" },
  { name: "Facebook", icon: "fa-brands fa-facebook-f", href: "#" },
  { name: "WhatsApp", icon: "fa-brands fa-whatsapp", href: "#" },
  { name: "LinkedIn", icon: "fa-brands fa-linkedin-in", href: "#" },
  { name: "YouTube", icon: "fa-brands fa-youtube", href: "#" }
];

type Feature = {
  icon: string;
  title: string;
  description: string;
  tone: string;
  dev: boolean;
};

const patientFeatures: Feature[] = [
  {
    icon: "fa-solid fa-user-check",
    title: "Cadastro de clientes",
    description:
      "Organize todos os seus clientes e oportunidades em um único local.",
    tone: "tone-green",
    dev: false
  },
  {
    icon: "fa-solid fa-user-plus",
    title: "Cadastro automatizado de pacientes",
    description:
      "Preenchimento rápido e sem retrabalho para acelerar o atendimento.",
    tone: "tone-warm",
    dev: true
  },
  {
    icon: "fa-solid fa-clipboard-list",
    title: "Fichamento de pacientes",
    description: "Prontuários e fichas completas, sempre ao seu alcance.",
    tone: "tone-brown",
    dev: false
  },
  {
    icon: "fa-solid fa-clock-rotate-left",
    title: "Histórico do paciente",
    description: "Todo o percurso clínico registrado e acessível em segundos.",
    tone: "tone-muted",
    dev: true
  }
];

const billingFeatures: Feature[] = [
  {
    icon: "fa-solid fa-file-invoice-dollar",
    title: "Emissão de notas fiscais",
    description: "Integração para emissão de NF-e sem sair do sistema.",
    tone: "tone-green",
    dev: true
  },
  {
    icon: "fa-solid fa-chart-pie",
    title: "Relatórios financeiros",
    description: "Visão clara do caixa da clínica com poucos cliques.",
    tone: "tone-warm",
    dev: false
  },
  {
    icon: "fa-solid fa-credit-card",
    title: "Recebimento por Pix, cartão e boleto",
    description: "Diversos meios de pagamento — cartão, Pix, boleto, dinheiro.",
    tone: "tone-brown",
    dev: false
  },
  {
    icon: "fa-solid fa-hospital-user",
    title: "Cadastro de convênios",
    description:
      "Convênios e planos de saúde organizados para facilitar seu dia.",
    tone: "tone-muted",
    dev: true
  }
];

const registryFeatures: Feature[] = [
  {
    icon: "fa-solid fa-heart-pulse",
    title: "Cadastro de CID",
    description: "Classificações de doenças sempre atualizadas e prontas.",
    tone: "tone-green",
    dev: true
  },
  {
    icon: "fa-solid fa-pills",
    title: "Cadastro de medicamentos",
    description: "Tabela de medicamentos completa para o dia a dia.",
    tone: "tone-warm",
    dev: true
  },
  {
    icon: "fa-solid fa-syringe",
    title: "Cadastro de procedimentos",
    description: "Procedimentos organizados por valores e especificidades.",
    tone: "tone-brown",
    dev: true
  }
];

const agendaFeatures: Feature[] = [
  {
    icon: "fa-solid fa-calendar",
    title: "Agenda médica em múltiplas visões",
    description: "Navegue por tabela, calendário e modo agenda como preferir.",
    tone: "tone-green",
    dev: true
  },
  {
    icon: "fa-solid fa-user-doctor",
    title: "Agendas por profissional",
    description: "Cada médico com sua própria agenda de atendimentos.",
    tone: "tone-warm",
    dev: true
  }
];

const highlightCards = [
  {
    icon: "fa-brands fa-whatsapp",
    title: "WhatsApp integrado",
    description: "Confirmações e lembretes de consultas direto no seu WhatsApp."
  },
  {
    icon: "fa-solid fa-bullseye",
    title: "Menos erros de marcação",
    description:
      "Agendamento automatizado reduz falhas, faltas e sobreposições."
  },
  {
    icon: "fa-solid fa-rotate-left",
    title: "Mais retornos",
    description: "Lembretes inteligentes que trazem seus pacientes de volta."
  }
];

/** Slides do hero. */
const slides = [
  {
    eyebrow: "Para clínicas e profissionais da saúde",
    title: "Sua clínica organizada, do agendamento ao faturamento",
    description:
      "Pacientes, agenda médica, prontuários e financeiro reunidos em uma única plataforma — simples, segura e pensada para quem cuida de gente.",
    points: [
      "Menos erros de agendamento",
      "Mais retorno de pacientes",
      "Faturamento simplificado"
    ]
  },
  {
    eyebrow: "Agendamentos",
    title: "Agendamentos conectados ao WhatsApp",
    description:
      "Confirmações e lembretes de consultas direto no WhatsApp dos seus pacientes, com menos falhas e sobreposições.",
    points: [
      "WhatsApp integrado",
      "Lembretes automáticos",
      "Menos faltas e retrabalho"
    ]
  },
  {
    eyebrow: "Pacientes",
    title: "Tudo sobre quem você atende",
    description:
      "Do cadastro ao histórico clínico, o percurso completo de cada paciente registrado e acessível em segundos.",
    points: [
      "Cadastro automatizado",
      "Fichamento e prontuários",
      "Histórico clínico completo"
    ]
  },
  {
    eyebrow: "Financeiro",
    title: "Faturamento sem complicação",
    description:
      "Cobranças, notas e recebimentos em poucos cliques, com vários meios de pagamento e relatórios claros.",
    points: [
      "Emissão de notas fiscais",
      "Pix, cartão e boleto",
      "Relatórios financeiros"
    ]
  }
];

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]!)) as { exp: number };
    return payload.exp < Date.now() / 1000;
  } catch {
    return true;
  }
}

// Usuário já autenticado não deve ver a página de apresentação.
onMounted(() => {
  const token = window.localStorage.getItem("token");
  if (token) {
    if (isTokenExpired(token)) {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      userStore.cleanCurrentUser();
      return;
    }
    void router.replace("/");
  }
});
</script>

<style scoped lang="scss">
.app-auth {
  min-height: 100vh;
  background: var(--app-soft);
}

.app-auth__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;

  @media (min-width: 640px) {
    flex-direction: row;
  }

  @media (min-width: 1024px) {
    padding: 24px 64px;
  }
}

.app-auth__logo {
  width: 160px;

  @media (min-width: 1024px) {
    width: 176px;
  }

  img {
    width: 100%;
  }
}

.app-auth__section {
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  padding: 40px 24px 64px;

  @media (min-width: 1024px) {
    padding: 40px 64px 64px;
  }
}

.app-btn-primary {
  background: var(--app-green);
  color: #fff;

  &:hover {
    background: var(--app-dark);
  }

  &:before {
    box-shadow: none !important;
  }
}

.app-btn-outline {
  color: var(--app-green);

  &:hover {
    border-color: var(--app-green);
  }
}

// Hero
.app-hero {
  overflow: hidden;
  background: var(--app-dark);
  border-radius: 12px;
  box-shadow: 0 24px 80px rgba(42, 26, 26, 0.1);
}

.app-hero__carousel {
  background: transparent;
}

.app-hero__slide {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 42rem;
  margin: 0 auto;
  padding: 64px 24px !important;
  text-align: center;

  @media (min-width: 1024px) {
    padding: 80px 24px !important;
  }
}

.app-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  color: var(--app-soft);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  outline: 1px solid rgba(255, 255, 255, 0.15);
}

.app-hero__title {
  margin: 24px 0 0;
  font-size: clamp(1.75rem, 3vw, 2.75rem);
  font-weight: 900;
  line-height: 1.15;
  color: #fff;
}

.app-hero__description {
  margin: 16px 0 0;
  font-size: 1rem;
  line-height: 1.625;
  color: var(--app-soft);
  opacity: 0.9;
}

.app-hero__points {
  margin: 32px 0 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 8px;
    color: var(--app-soft);

    i {
      color: var(--app-warm);
    }
  }
}

.app-hero__dot {
  width: 8px;
  height: 8px;
  padding: 0;
  cursor: pointer;
  background: rgba(251, 242, 227, 0.3);
  border: none;
  border-radius: 9999px;
  transition: all 0.2s;

  &:hover {
    background: rgba(251, 242, 227, 0.6);
  }

  &--active {
    width: 24px;
    background: var(--app-warm);
  }
}

// Seções de features
.app-section-label {
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-muted);

  &--light {
    color: var(--app-soft);
  }
}

.app-section-title {
  margin: 12px 0 0;
  font-size: clamp(1.5rem, 2.5vw, 2.25rem);
  font-weight: 900;
  color: var(--app-dark);

  &--light {
    color: #fff;
  }
}

.app-section-description {
  max-width: 36rem;
  margin: 8px 0 0;
  color: var(--app-muted);

  &--light {
    color: var(--app-soft);
    opacity: 0.9;
  }
}

.app-feature-grid {
  display: grid;
  gap: 16px;
  margin-top: 40px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  &--three {
    @media (min-width: 1024px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  &--two {
    @media (min-width: 1024px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}

.app-feature-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  text-align: left;
  background: #fff;
  border-radius: 12px;
  outline: 1px solid var(--app-border);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    font-size: 1.125rem;
    border-radius: 8px;

    &.tone-green {
      background: rgba(78, 110, 93, 0.1);
      color: var(--app-green);
    }

    &.tone-warm {
      background: rgba(184, 148, 46, 0.1);
      color: var(--app-warm);
    }

    &.tone-brown {
      background: rgba(86, 44, 44, 0.1);
      color: var(--app-brown);
    }

    &.tone-muted {
      background: rgba(107, 102, 95, 0.1);
      color: var(--app-muted);
    }
  }

  &__title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--app-dark);
  }

  &__dev {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--app-brown);
    background: rgba(86, 44, 44, 0.1);
    border-radius: 9999px;
  }

  &__description {
    margin: 0;
    font-size: 0.875rem;
    color: var(--app-muted);
  }
}

.app-highlight {
  overflow: hidden;
  background: var(--app-brown);
  border-radius: 12px;
  box-shadow: 0 24px 70px rgba(86, 44, 44, 0.25);
  margin-top: 0 !important;

  &__card {
    height: 100%;
    padding: 28px;
    background: #fff;
    border-radius: 12px;
    transition: transform 0.2s;

    i {
      color: var(--app-warm);
    }

    &:hover {
      transform: translateY(-4px);
    }
  }
}

// CTA final
.app-contact {
  padding: 64px 32px;
  text-align: center;
  background: var(--app-dark);
  border-radius: 12px;

  &__title {
    margin: 0;
    font-size: clamp(1.5rem, 2.5vw, 2.25rem);
    font-weight: 900;
    color: #fff;
  }

  &__description {
    margin: 12px 0 0;
    color: var(--app-soft);
    opacity: 0.9;
  }
}

// Footer
.app-footer-dark {
  width: 100%;
  background: var(--app-dark);
}

.app-footer-dark__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  max-width: 72rem;
  margin: 0 auto;
  padding: 40px 24px;

  @media (min-width: 640px) {
    flex-direction: row;
  }

  @media (min-width: 1024px) {
    padding: 40px 64px;
  }
}

.app-footer-dark__brand {
  color: var(--app-soft);
}

.app-footer-dark__tagline {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: var(--app-muted);
}

.app-footer-dark__copy {
  margin: 8px 0 0;
  font-size: 0.75rem;
  color: var(--app-muted);
  opacity: 0.8;
}

.app-footer-dark__social-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-muted);
}

.app-footer-dark__social {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--app-soft);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.15s;

  &:hover {
    background: var(--app-green);
    border-color: var(--app-green);
  }
}
</style>
