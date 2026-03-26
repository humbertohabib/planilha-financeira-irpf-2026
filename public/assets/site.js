const app = document.querySelector("#app");

const state = {
  content: null,
  isSubmitting: false,
  lastResult: null
};

bootstrap();

async function bootstrap() {
  try {
    const response = await fetch("/api/content", { cache: "no-store" });
    const content = await response.json();
    state.content = content;
    render();
  } catch (error) {
    app.innerHTML = `
      <main class="shell" style="padding:48px 0;">
        <div class="section-card" style="padding:28px;">
          <h1>Não foi possível carregar a página.</h1>
          <p class="muted">Tente novamente em alguns instantes.</p>
        </div>
      </main>
    `;
    console.error(error);
  }
}

function render() {
  const { content } = state;

  app.innerHTML = `
    <header class="shell topbar">
      <a class="brand" href="#topo">
        <span class="brand-mark">CM</span>
        <span>${escapeHtml(content.brandName)}</span>
      </a>
      <a class="nav-link" href="/admin.html">Painel</a>
    </header>

    <main id="topo">
      <section class="shell hero">
        <div class="hero-copy">
          <span class="hero-kicker">${escapeHtml(content.heroTag)}</span>
          <h1>${escapeHtml(content.heroTitle)}</h1>
          <p>${escapeHtml(content.heroDescription)}</p>

          <div class="badge-row">
            ${content.badgeItems.map((item) => `<div class="mini-badge">${escapeHtml(item)}</div>`).join("")}
          </div>

          <div class="cta-row">
            <button class="button primary" data-open-form>${escapeHtml(content.ctaPrimaryLabel)}</button>
            <a class="button-link secondary" href="${escapeAttribute(content.ctaSecondaryHref)}">${escapeHtml(content.ctaSecondaryLabel)}</a>
          </div>
        </div>

        <div class="hero-visual">
          <img src="/assets/teacher-hero.svg" alt="Ilustração de uma professora sorrindo e preparando aula." />
          <div class="floating-note">
            <strong>Fluxo automatizado</strong>
            <div class="muted small">A inscrição gera os 3 documentos para assinatura e entrega o link do grupo em seguida.</div>
          </div>
        </div>
      </section>

      <section class="shell">
        <div class="section-head">
          <h2>${escapeHtml(content.aboutTitle)}</h2>
          <p>${escapeHtml(content.aboutText)}</p>
        </div>

        <div class="grid-3">
          ${content.highlights
            .map(
              (item) => `
                <article class="highlight-card">
                  <h3>${escapeHtml(item.title)}</h3>
                  <p class="card-text">${escapeHtml(item.text)}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="shell grid-2">
        <div class="story-card section-card" style="padding:30px;">
          <div class="section-head" style="margin-bottom:0;">
            <h2>Apresentação do trabalho</h2>
            <p>Área pensada para destacar sua metodologia, proposta e posicionamento de forma clara para quem chega pelo Instagram.</p>
          </div>
          <div class="stats-row">
            <div class="stat-card">
              <strong>Bio + CTA</strong>
              <span class="muted">Uma página enxuta para conversão rápida.</span>
            </div>
            <div class="stat-card">
              <strong>Vídeos</strong>
              <span class="muted">Espaço para aulas demonstrativas e apresentação.</span>
            </div>
            <div class="stat-card">
              <strong>Depoimentos</strong>
              <span class="muted">Prova social para fortalecer a decisão.</span>
            </div>
          </div>
        </div>
        <div class="story-card">
          <img src="/assets/teacher-story.svg" alt="Ilustração de professora em sala organizada com livros e materiais." />
        </div>
      </section>

      <section class="shell" id="videos">
        <div class="section-head">
          <h2>Vídeos</h2>
          <p>Você pode trocar os links pelo painel administrativo usando embeds do YouTube.</p>
        </div>
        <div class="video-grid">
          ${content.videos
            .map(
              (video) => `
                <article class="video-card">
                  <h3>${escapeHtml(video.title)}</h3>
                  <div style="margin-top:16px;">
                    <iframe src="${escapeAttribute(video.embedUrl)}" title="${escapeAttribute(video.title)}" allowfullscreen></iframe>
                  </div>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="shell" id="depoimentos">
        <div class="section-head">
          <h2>Depoimentos de alunas</h2>
          <p>Blocos simples para reforçar confiança e mostrar a experiência de quem já participou.</p>
        </div>
        <div class="testimonial-grid">
          ${content.testimonials
            .map(
              (testimonial) => `
                <article class="testimonial-card">
                  <p>“${escapeHtml(testimonial.text)}”</p>
                  <strong>${escapeHtml(testimonial.author)}</strong>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="shell">
        <div class="enrollment-card">
          <div class="section-head">
            <h2>${escapeHtml(content.enrollment.formTitle)}</h2>
            <p>${escapeHtml(content.enrollment.formDescription)}</p>
          </div>
          <div class="chip-list">
            <div class="chip">1. Preenche o formulário</div>
            <div class="chip">2. Recebe 3 documentos</div>
            <div class="chip">3. Entra no grupo de WhatsApp</div>
          </div>
          <div style="margin-top:22px;">
            <button class="button primary" data-open-form>${escapeHtml(content.enrollment.submitLabel)}</button>
          </div>
        </div>
      </section>
    </main>

    <footer class="shell footer">
      <div>Projeto MVP em pt-BR, com conteúdo editável e fluxo automático de inscrição.</div>
    </footer>

    <div class="floating-cta">
      <button class="button primary" data-open-form>${escapeHtml(content.ctaPrimaryLabel)}</button>
    </div>

    <div class="modal" id="signup-modal">
      <div class="modal-card">
        <div class="modal-head">
          <div>
            <h2>${escapeHtml(content.enrollment.formTitle)}</h2>
            <p class="muted">${escapeHtml(content.enrollment.formDescription)}</p>
          </div>
          <button class="button ghost" type="button" data-close-form>Fechar</button>
        </div>
        <form id="signup-form" class="stack">
          <div class="form-grid">
            <label class="field">
              <span>Nome completo</span>
              <input name="name" placeholder="Seu nome" required />
            </label>
            <label class="field">
              <span>E-mail</span>
              <input name="email" type="email" placeholder="voce@email.com" required />
            </label>
          </div>
          <div class="form-grid">
            <label class="field">
              <span>WhatsApp</span>
              <input name="phone" placeholder="(11) 99999-9999" required />
            </label>
            <label class="field">
              <span>Interesse</span>
              <input name="interest" placeholder="Ex.: Mentoria, turma intensiva" />
            </label>
          </div>
          <label class="field">
            <span>Mensagem</span>
            <textarea name="message" placeholder="Conte em poucas palavras o que você busca."></textarea>
          </label>
          <div id="form-feedback"></div>
          <button class="button primary full" type="submit">
            ${state.isSubmitting ? "Enviando..." : escapeHtml(content.enrollment.submitLabel)}
          </button>
        </form>
        <div id="signup-result" class="${state.lastResult ? "stack" : "hidden"}"></div>
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-open-form]").forEach((button) => {
    button.addEventListener("click", openModal);
  });

  const modal = document.querySelector("#signup-modal");
  const closeButton = document.querySelector("[data-close-form]");
  const form = document.querySelector("#signup-form");

  closeButton.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  form.addEventListener("submit", handleSubmit);

  if (state.lastResult) {
    renderResult();
  }
}

function openModal() {
  document.body.classList.add("modal-open");
  document.querySelector("#signup-modal").classList.add("open");
}

function closeModal() {
  document.body.classList.remove("modal-open");
  document.querySelector("#signup-modal").classList.remove("open");
}

async function handleSubmit(event) {
  event.preventDefault();
  if (state.isSubmitting) return;

  const form = event.currentTarget;
  const feedback = document.querySelector("#form-feedback");
  const data = new FormData(form);

  state.isSubmitting = true;
  feedback.innerHTML = "";
  render();
  openModal();

  try {
    const response = await fetch("/api/enrollments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        phone: data.get("phone"),
        interest: `${data.get("interest") || ""}${data.get("message") ? ` | ${data.get("message")}` : ""}`
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Falha ao enviar inscrição.");
    }

    state.lastResult = payload;
    state.isSubmitting = false;
    render();
    openModal();
    document.querySelector("#signup-form").reset();
    renderResult();
  } catch (error) {
    state.isSubmitting = false;
    render();
    openModal();
    document.querySelector("#form-feedback").innerHTML = `<div class="status error">${escapeHtml(error.message)}</div>`;
  }
}

function renderResult() {
  const target = document.querySelector("#signup-result");
  if (!target || !state.lastResult) return;

  target.classList.remove("hidden");
  target.innerHTML = `
    <div class="status success">
      <strong>${escapeHtml(state.lastResult.successTitle)}</strong>
      <div>${escapeHtml(state.lastResult.message)}</div>
    </div>
    <div class="document-list">
      ${state.lastResult.documents
        .map(
          (document) => `
            <div class="document-item">
              <div>
                <strong>${escapeHtml(document.name)}</strong>
                <div class="muted small">Link preparado automaticamente para assinatura eletrônica.</div>
              </div>
              <a class="button secondary" href="${escapeAttribute(document.url)}" target="_blank" rel="noreferrer">Abrir documento</a>
            </div>
          `
        )
        .join("")}
    </div>
    <a class="button primary full" href="${escapeAttribute(state.lastResult.whatsappGroupUrl)}" target="_blank" rel="noreferrer">Entrar no grupo de WhatsApp</a>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "");
}
