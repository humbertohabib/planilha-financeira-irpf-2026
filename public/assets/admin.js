const app = document.querySelector("#app");
const sessionKey = "professora-admin-token";

const state = {
  token: localStorage.getItem(sessionKey) || "",
  dashboard: null,
  loading: true,
  error: ""
};

bootstrap();

async function bootstrap() {
  if (!state.token) {
    state.loading = false;
    renderLogin();
    return;
  }

  await loadDashboard();
}

async function loadDashboard() {
  state.loading = true;
  renderLoading();

  try {
    const response = await fetch("/api/admin/dashboard", {
      headers: {
        Authorization: `Bearer ${state.token}`
      },
      cache: "no-store"
    });

    if (response.status === 401) {
      localStorage.removeItem(sessionKey);
      state.token = "";
      state.loading = false;
      renderLogin("Sua sessão expirou. Faça login novamente.");
      return;
    }

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Não foi possível carregar o painel.");
    }

    state.dashboard = payload;
    state.loading = false;
    renderDashboard();
  } catch (error) {
    state.loading = false;
    state.error = error.message;
    renderLogin(error.message);
  }
}

function renderLoading() {
  app.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <h1>Carregando painel...</h1>
        <p class="muted">Buscando conteúdo editável e inscrições registradas.</p>
      </div>
    </div>
  `;
}

function renderLogin(message = "") {
  app.innerHTML = `
    <div class="auth-wrap">
      <form class="auth-card stack" id="login-form">
        <div>
          <div class="hero-kicker">Painel administrativo</div>
          <h1 style="margin-top:16px; font-size:3rem;">Editar landing page</h1>
          <p class="muted">Login padrão do MVP: <strong>admin@professora.local</strong> com senha <strong>prof123</strong>. Altere por variáveis de ambiente no Render.</p>
        </div>
        <label class="field">
          <span>E-mail</span>
          <input name="email" type="email" value="admin@professora.local" required />
        </label>
        <label class="field">
          <span>Senha</span>
          <input name="password" type="password" value="prof123" required />
        </label>
        ${message ? `<div class="notice error">${escapeHtml(message)}</div>` : ""}
        <button class="button primary full" type="submit">Entrar no painel</button>
      </form>
    </div>
  `;

  document.querySelector("#login-form").addEventListener("submit", handleLogin);
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password")
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Falha ao autenticar.");
    }

    state.token = payload.token;
    localStorage.setItem(sessionKey, payload.token);
    await loadDashboard();
  } catch (error) {
    renderLogin(error.message);
  }
}

function renderDashboard() {
  const { content, enrollments } = state.dashboard;

  app.innerHTML = `
    <div class="admin-shell">
      <header class="admin-topbar">
        <div>
          <div class="hero-kicker">MVP pronto para Render</div>
          <h1 style="margin-top:16px; font-size:3.2rem;">Painel da landing page</h1>
          <p class="muted">Edite os textos, vídeos, depoimentos e links da automação sem sair do navegador.</p>
        </div>
        <div class="inline-actions" style="width:min(360px, 100%);">
          <a class="button secondary" href="/" target="_blank" rel="noreferrer">Abrir landing page</a>
          <button class="button ghost" id="logout-button" type="button">Sair</button>
        </div>
      </header>

      <section class="panel">
        <div class="section-head">
          <h2>Resumo rápido</h2>
          <p>Como o banco está em memória, essas edições permanecem ativas enquanto a instância estiver rodando.</p>
        </div>
        <div class="metrics">
          <div class="stat-card">
            <strong>${enrollments.length}</strong>
            <span class="muted">Inscrições recebidas</span>
          </div>
          <div class="stat-card">
            <strong>${content.videos.length}</strong>
            <span class="muted">Vídeos publicados</span>
          </div>
          <div class="stat-card">
            <strong>${content.testimonials.length}</strong>
            <span class="muted">Depoimentos ativos</span>
          </div>
        </div>
      </section>

      <form id="content-form" class="stack">
        <section class="panel stack">
          <div class="section-head">
            <h2>Textos principais</h2>
            <p>Esses campos aparecem logo no topo da página.</p>
          </div>
          <label class="field">
            <span>Nome/marca</span>
            <input name="brandName" value="${escapeAttribute(content.brandName)}" />
          </label>
          <label class="field">
            <span>Chamada curta</span>
            <input name="heroTag" value="${escapeAttribute(content.heroTag)}" />
          </label>
          <label class="field">
            <span>Título principal</span>
            <textarea name="heroTitle">${escapeHtml(content.heroTitle)}</textarea>
          </label>
          <label class="field">
            <span>Descrição principal</span>
            <textarea name="heroDescription">${escapeHtml(content.heroDescription)}</textarea>
          </label>
          <div class="form-grid">
            <label class="field">
              <span>Botão principal</span>
              <input name="ctaPrimaryLabel" value="${escapeAttribute(content.ctaPrimaryLabel)}" />
            </label>
            <label class="field">
              <span>Botão secundário</span>
              <input name="ctaSecondaryLabel" value="${escapeAttribute(content.ctaSecondaryLabel)}" />
            </label>
          </div>
        </section>

        <section class="panel stack">
          <div class="section-head">
            <h2>Apresentação</h2>
            <p>Use uma linha por item para badges, diferenciais, vídeos, depoimentos e documentos.</p>
          </div>
          <label class="field">
            <span>Título da seção</span>
            <input name="aboutTitle" value="${escapeAttribute(content.aboutTitle)}" />
          </label>
          <label class="field">
            <span>Texto da seção</span>
            <textarea name="aboutText">${escapeHtml(content.aboutText)}</textarea>
          </label>
          <label class="field">
            <span>Badges do topo</span>
            <textarea name="badgeItems">${escapeHtml(content.badgeItems.join("\n"))}</textarea>
          </label>
          <label class="field">
            <span>Diferenciais (formato: Título | Texto)</span>
            <textarea name="highlights">${escapeHtml(content.highlights.map((item) => `${item.title} | ${item.text}`).join("\n"))}</textarea>
          </label>
          <label class="field">
            <span>Vídeos (formato: Título | URL embed)</span>
            <textarea name="videos">${escapeHtml(content.videos.map((item) => `${item.title} | ${item.embedUrl}`).join("\n"))}</textarea>
          </label>
          <label class="field">
            <span>Depoimentos (formato: Nome | Texto)</span>
            <textarea name="testimonials">${escapeHtml(content.testimonials.map((item) => `${item.author} | ${item.text}`).join("\n"))}</textarea>
          </label>
        </section>

        <section class="panel stack">
          <div class="section-head">
            <h2>Automação da inscrição</h2>
            <p>Configure os textos do formulário e os links entregues ao final do processo.</p>
          </div>
          <div class="form-grid">
            <label class="field">
              <span>Título do formulário</span>
              <input name="formTitle" value="${escapeAttribute(content.enrollment.formTitle)}" />
            </label>
            <label class="field">
              <span>Texto do botão</span>
              <input name="submitLabel" value="${escapeAttribute(content.enrollment.submitLabel)}" />
            </label>
          </div>
          <label class="field">
            <span>Descrição do formulário</span>
            <textarea name="formDescription">${escapeHtml(content.enrollment.formDescription)}</textarea>
          </label>
          <div class="form-grid">
            <label class="field">
              <span>Título de sucesso</span>
              <input name="successTitle" value="${escapeAttribute(content.enrollment.successTitle)}" />
            </label>
            <label class="field">
              <span>Mensagem de sucesso</span>
              <input name="successMessage" value="${escapeAttribute(content.enrollment.successMessage)}" />
            </label>
          </div>
          <div class="form-grid">
            <label class="field">
              <span>Link do grupo de WhatsApp</span>
              <input name="whatsappGroupUrl" value="${escapeAttribute(content.enrollment.whatsappGroupUrl)}" />
            </label>
            <label class="field">
              <span>Base dos links de assinatura</span>
              <input name="signatureBaseUrl" value="${escapeAttribute(content.enrollment.signatureBaseUrl)}" />
            </label>
          </div>
          <label class="field">
            <span>Documentos (um por linha)</span>
            <textarea name="documents">${escapeHtml(content.enrollment.documents.join("\n"))}</textarea>
          </label>
          <div class="inline-actions">
            <button class="button primary" type="submit">Salvar alterações</button>
            <div id="save-feedback"></div>
          </div>
        </section>
      </form>

      <section class="panel">
        <div class="section-head">
          <h2>Prévia rápida</h2>
          <p>Resumo do que ficará visível para quem chegar pela landing page.</p>
        </div>
        <div class="preview stack">
          <strong>${escapeHtml(content.heroTitle)}</strong>
          <span class="muted">${escapeHtml(content.heroDescription)}</span>
          <span class="small">WhatsApp: ${escapeHtml(content.enrollment.whatsappGroupUrl)}</span>
          <span class="small">Documentos: ${escapeHtml(content.enrollment.documents.join(", "))}</span>
        </div>
      </section>

      <section class="panel table-card">
        <div class="section-head">
          <h2>Inscrições recebidas</h2>
          <p>Cada envio gera os 3 documentos de assinatura e associa o link do grupo.</p>
        </div>
        ${renderLeads(enrollments)}
      </section>
    </div>
  `;

  document.querySelector("#logout-button").addEventListener("click", handleLogout);
  document.querySelector("#content-form").addEventListener("submit", handleSave);
}

function renderLeads(enrollments) {
  if (!enrollments.length) {
    return `<div class="notice success">Nenhuma inscrição ainda. Quando alguém preencher o formulário, ela aparecerá aqui.</div>`;
  }

  return `
    <table class="table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Contato</th>
          <th>Interesse</th>
          <th>Status</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        ${enrollments
          .map(
            (lead) => `
              <tr>
                <td>
                  <strong>${escapeHtml(lead.name)}</strong><br />
                  <span class="muted small">${lead.documents.length} documentos gerados</span>
                </td>
                <td>${escapeHtml(lead.email)}<br />${escapeHtml(lead.phone)}</td>
                <td>${escapeHtml(lead.interest || "Sem observação")}</td>
                <td>${escapeHtml(lead.status)}</td>
                <td>${new Date(lead.createdAt).toLocaleString("pt-BR")}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

async function handleSave(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const feedback = document.querySelector("#save-feedback");

  const payload = {
    brandName: form.get("brandName"),
    heroTag: form.get("heroTag"),
    heroTitle: form.get("heroTitle"),
    heroDescription: form.get("heroDescription"),
    ctaPrimaryLabel: form.get("ctaPrimaryLabel"),
    ctaSecondaryLabel: form.get("ctaSecondaryLabel"),
    ctaSecondaryHref: "#depoimentos",
    aboutTitle: form.get("aboutTitle"),
    aboutText: form.get("aboutText"),
    badgeItems: parseLines(form.get("badgeItems")),
    highlights: parsePairs(form.get("highlights"), ["title", "text"]),
    videos: parsePairs(form.get("videos"), ["title", "embedUrl"]),
    testimonials: parsePairs(form.get("testimonials"), ["author", "text"]),
    enrollment: {
      formTitle: form.get("formTitle"),
      formDescription: form.get("formDescription"),
      submitLabel: form.get("submitLabel"),
      successTitle: form.get("successTitle"),
      successMessage: form.get("successMessage"),
      whatsappGroupUrl: form.get("whatsappGroupUrl"),
      signatureBaseUrl: form.get("signatureBaseUrl"),
      documents: parseLines(form.get("documents"))
    }
  };

  try {
    const response = await fetch("/api/admin/content", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Não foi possível salvar.");
    }

    state.dashboard.content = data.content;
    feedback.innerHTML = `<div class="notice success">Alterações salvas com sucesso.</div>`;
    renderDashboard();
  } catch (error) {
    feedback.innerHTML = `<div class="notice error">${escapeHtml(error.message)}</div>`;
  }
}

async function handleLogout() {
  try {
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${state.token}`
      }
    });
  } finally {
    localStorage.removeItem(sessionKey);
    state.token = "";
    state.dashboard = null;
    renderLogin();
  }
}

function parseLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parsePairs(value, keys) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [left, ...rest] = line.split("|");
      return {
        [keys[0]]: (left || "").trim(),
        [keys[1]]: rest.join("|").trim()
      };
    })
    .filter((item) => item[keys[0]] && item[keys[1]]);
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
