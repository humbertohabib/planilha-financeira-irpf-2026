const STORAGE_KEY = "irpf-mvp-db";
const SESSION_KEY = "irpf-mvp-session";
const UI_KEY = "irpf-mvp-ui";

const $app = document.querySelector("#app");
const pageType = document.body.dataset.page;

const seed = {
  statuses: [
    { id: uid(), name: "PENDENTE", color: "#ff7a00" },
    { id: uid(), name: "EM DIGITACAO", color: "#2d7ff9" },
    { id: uid(), name: "EM CONFERENCIA", color: "#8b5cf6" },
    { id: uid(), name: "ENTREGUE", color: "#10b981" },
    { id: uid(), name: "TRANSMITIDA", color: "#0f766e" },
    { id: uid(), name: "OUTROS", color: "#6b7280", fixed: true }
  ],
  users: [
    { id: uid(), name: "Admin Mestre", email: "admin@irpf.local", password: "admin123", role: "admin", activeByPeriod: {} },
    { id: uid(), name: "Ana Silva", email: "ana@irpf.local", password: "ana123", role: "employee", activeByPeriod: {} },
    { id: uid(), name: "Carlos Lima", email: "carlos@irpf.local", password: "carlos123", role: "conference", activeByPeriod: {} },
    { id: uid(), name: "Fernanda Rocha", email: "fernanda@irpf.local", password: "fernanda123", role: "employee", activeByPeriod: {} }
  ],
  periods: [],
  clients: [],
  notifications: [],
  hourEntries: [],
  settings: {
    theme: "light",
    customReportLink: "https://render.com/"
  }
};

initializeSeed();

let state = loadState();
let session = loadSession();
let statusChart;

applyTheme();
bootstrap();

function bootstrap() {
  showLoading("Inicializando ambiente...");
  window.setTimeout(() => {
    if (!session?.userId) {
      renderLogin();
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      clearSession();
      renderLogin();
      return;
    }

    if (pageType === "admin" && user.role !== "admin") {
      window.location.href = "/index.html";
      return;
    }

    if (pageType === "employee" && user.role === "admin") {
      window.location.href = "/admin.html";
      return;
    }

    renderApp();
  }, 500);
}

function initializeSeed() {
  const current = loadRawState();
  if (current) return;

  const currentYearPeriod = {
    id: uid(),
    name: "IRPF 2026",
    year: 2026,
    createdAt: nowIso(),
    steps: [
      { id: uid(), name: "Contato Inicial" },
      { id: uid(), name: "Conferência de Endereço" },
      { id: uid(), name: "Digitação" },
      { id: uid(), name: "Documentação" },
      { id: uid(), name: "Enviada à conferência" }
    ]
  };

  seed.periods = [currentYearPeriod];
  const admin = seed.users.find((user) => user.role === "admin");
  const employee = seed.users.find((user) => user.email === "ana@irpf.local");
  const employee2 = seed.users.find((user) => user.email === "fernanda@irpf.local");
  const reviewer = seed.users.find((user) => user.role === "conference");
  const pending = seed.statuses.find((status) => status.name === "PENDENTE");
  const delivered = seed.statuses.find((status) => status.name === "ENTREGUE");
  const progressTemplate = currentYearPeriod.steps.map((step, index) => ({
    stepId: step.id,
    done: index < 2
  }));

  seed.clients = [
    {
      id: uid(),
      periodId: currentYearPeriod.id,
      name: "João da Silva",
      cpf: "123.456.789-09",
      group: "VIP",
      ownerId: employee.id,
      conferenceIds: [reviewer.id],
      statusId: pending.id,
      statusNote: "",
      phones: [
        { id: uid(), label: "WhatsApp", number: "11987654321", primary: true },
        { id: uid(), label: "Escritório", number: "1133334444", primary: false }
      ],
      emails: [{ id: uid(), label: "Principal", email: "joao@email.com", primary: true }],
      legacyEmail: "joao@email.com",
      contactReference: "Sócio",
      notes: "Cliente com entrega prioritária.",
      progress: progressTemplate,
      messages: [
        {
          id: uid(),
          fromUserId: admin.id,
          text: "Priorizar conferência da documentação enviada.",
          attachmentName: "checklist-irpf.pdf",
          createdAt: nowIso()
        }
      ],
      lockedBy: null,
      createdAt: nowIso()
    },
    {
      id: uid(),
      periodId: currentYearPeriod.id,
      name: "Maria Oliveira",
      cpf: "987.654.321-00",
      group: "Regular",
      ownerId: employee2.id,
      conferenceIds: [reviewer.id],
      statusId: delivered.id,
      statusNote: "",
      phones: [{ id: uid(), label: "Celular", number: "21988887777", primary: true }],
      emails: [{ id: uid(), label: "Trabalho", email: "maria@empresa.com", primary: true }],
      legacyEmail: "",
      contactReference: "Assistente",
      notes: "Aguardando transmissão.",
      progress: currentYearPeriod.steps.map((step) => ({ stepId: step.id, done: true })),
      messages: [],
      lockedBy: reviewer.id,
      createdAt: nowIso()
    }
  ];

  seed.notifications = [
    {
      id: uid(),
      userId: employee.id,
      title: "Novo cliente atribuído",
      text: "João da Silva foi vinculado a você.",
      read: false,
      createdAt: nowIso()
    }
  ];

  seed.hourEntries = [
    { id: uid(), userId: employee.id, date: "2026-03-18", start: "08:00", end: "17:00", description: "Atendimento e digitação" },
    { id: uid(), userId: employee2.id, date: "2026-03-18", start: "09:00", end: "18:30", description: "Conferência de pendências" }
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function loadRawState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function loadState() {
  return loadRawState() || structuredClone(seed);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function saveSession(nextSession) {
  session = nextSession;
  localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
}

function clearSession() {
  session = null;
  localStorage.removeItem(SESSION_KEY);
}

function loadUiState() {
  try {
    return JSON.parse(localStorage.getItem(UI_KEY)) || {};
  } catch {
    return {};
  }
}

function saveUiState(next) {
  localStorage.setItem(UI_KEY, JSON.stringify(next));
}

function applyTheme() {
  document.body.dataset.theme = state.settings.theme || "light";
}

function getCurrentUser() {
  return state.users.find((user) => user.id === session?.userId) || null;
}

function getActivePeriodId() {
  const ui = loadUiState();
  return ui.activePeriodId || state.periods[0]?.id || null;
}

function setActivePeriodId(periodId) {
  const ui = loadUiState();
  ui.activePeriodId = periodId;
  saveUiState(ui);
}

function getActivePeriod() {
  return state.periods.find((period) => period.id === getActivePeriodId()) || state.periods[0];
}

function showLoading(text) {
  $app.innerHTML = `
    <div class="login-shell">
      <div class="login-card">
        <div class="login-hero">
          <div class="brand">
            <div class="brand-logo">IR<br />PF</div>
            <div class="brand-text">
              <strong>IRPF 2026</strong>
              <span>Painel de controle tributário</span>
            </div>
          </div>
          <h1>${text}</h1>
          <p class="muted">Carregando autenticação, períodos e preferências do sistema.</p>
        </div>
        <div class="login-form">
          <div class="kanban-note">Preparando o ambiente para ${pageType === "admin" ? "administradores" : "operação"}.</div>
        </div>
      </div>
    </div>
  `;
}

function renderLogin() {
  const adminMode = pageType === "admin";
  const title = adminMode ? "Acesso do administrador" : "Acesso da operação";
  const allowedRoles = adminMode ? ["admin"] : ["employee", "conference"];

  $app.innerHTML = `
    <div class="login-shell">
      <div class="login-card">
        <div class="login-hero">
          <div class="brand">
            <div class="brand-logo">IR<br />PF</div>
            <div>
              <strong>${adminMode ? "IRPF Admin" : "IRPF Operação"}</strong>
              <div class="muted">Controle de clientes, conferência e períodos</div>
            </div>
          </div>
          <h1>${title}</h1>
          <p>Login separado por papel com persistência de sessão local, pronto para evoluir para Firebase.</p>
          <div class="stack">
            ${allowedRoles
              .map((role) => {
                const user = state.users.find((item) => item.role === role);
                return `
                  <div class="kanban-note">
                    <strong>${labelRole(role)}</strong>
                    <div>${user?.email || "-"}</div>
                    <div class="muted">Senha: ${user?.password || "-"}</div>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
        <form class="login-form" id="login-form">
          <div>
            <h2>${title}</h2>
            <p class="muted">Use os usuários seed ou cadastre novos usuários no painel admin.</p>
          </div>
          <label class="field">
            <span>E-mail</span>
            <input name="email" type="email" required placeholder="nome@empresa.com" />
          </label>
          <label class="field">
            <span>Senha</span>
            <input name="password" type="password" required placeholder="********" />
          </label>
          <div class="login-actions">
            <button class="button primary" type="submit">Entrar</button>
            <a class="button secondary" href="${adminMode ? "/index.html" : "/admin.html"}">
              ${adminMode ? "Área operacional" : "Área administrativa"}
            </a>
          </div>
          <p id="login-feedback" class="muted"></p>
        </form>
      </div>
    </div>
  `;

  document.querySelector("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const user = state.users.find((item) => item.email.toLowerCase() === email && item.password === password);
    const feedback = document.querySelector("#login-feedback");

    if (!user || !allowedRoles.includes(user.role)) {
      feedback.textContent = "Credenciais inválidas para esta área.";
      return;
    }

    saveSession({ userId: user.id, role: user.role });
    window.location.href = user.role === "admin" ? "/admin.html" : "/index.html";
  });
}

function renderApp() {
  const currentUser = getCurrentUser();
  const pageKey = getDefaultPage(currentUser);
  const ui = loadUiState();
  const currentTab = ui.currentTab || pageKey;
  const notifications = state.notifications.filter((item) => item.userId === currentUser.id && !item.read);

  $app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar"></aside>
      <main class="main">
        <header class="topbar">
          <div class="row">
            <button class="button secondary mobile-toggle" id="sidebar-toggle">?</button>
            <div>
              <strong>${navTitle(currentTab)}</strong>
              <div class="muted">${navSubtitle(currentTab, currentUser.role)}</div>
            </div>
          </div>
          <div class="row">
            <span class="notification-badge">Não lidas: ${notifications.length}</span>
            <button class="button secondary" id="theme-toggle">
              ${state.settings.theme === "dark" ? "Modo claro" : "Modo escuro"}
            </button>
            <button class="button secondary" id="logout-btn">Sair</button>
          </div>
        </header>
        <section class="page" id="page-content"></section>
      </main>
    </div>
    <div class="modal" id="modal-root"></div>
  `;

  renderSidebar(currentUser, currentTab, notifications.length);
  renderCurrentPage(currentTab);

  document.querySelector("#logout-btn").addEventListener("click", () => {
    clearSession();
    renderLogin();
  });

  document.querySelector("#theme-toggle").addEventListener("click", () => {
    state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
    saveState();
    applyTheme();
    renderApp();
  });

  const toggle = document.querySelector("#sidebar-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));
  }
}

function renderSidebar(user, currentTab, unreadCount) {
  const sidebar = document.querySelector("#sidebar");
  const period = getActivePeriod();
  const items = getNavItems(user.role);

  sidebar.innerHTML = `
    <div class="brand">
      <div class="brand-logo">IR<br />PF</div>
      <div class="brand-text">
        <strong>${user.role === "admin" ? "IRPF Admin" : "IRPF Operação"}</strong>
        <span class="muted">${user.role === "admin" ? "Painel de controle" : "Fluxo em tempo real"}</span>
      </div>
    </div>
    <div class="profile-card">
      <div class="row">
        <div class="avatar">${initials(user.name)}</div>
        <div>
          <strong>${user.name}</strong>
          <div class="muted">${labelRole(user.role)}</div>
        </div>
      </div>
    </div>
    <div class="period-switcher">
      <select id="period-select">
        ${state.periods.map((item) => `<option value="${item.id}" ${item.id === period?.id ? "selected" : ""}>${item.name}</option>`).join("")}
      </select>
    </div>
    <nav>
      ${items
        .map((section) => `
          <div class="nav-section">${section.label}</div>
          ${section.items
            .map(
              (item) => `
                <div class="nav-item ${item.key === currentTab ? "active" : ""}" data-tab="${item.key}">
                  <span>${item.icon}</span>
                  <span>${item.name}</span>
                  ${item.key === "notifications" && unreadCount ? `<span class="notification-badge">${unreadCount}</span>` : ""}
                </div>
              `
            )
            .join("")}
        `)
        .join("")}
    </nav>
    <div class="sidebar-footer">
      <div class="nav-item" data-tab="settings">?? <span>Configurações</span></div>
    </div>
  `;

  sidebar.querySelectorAll("[data-tab]").forEach((node) => {
    node.addEventListener("click", () => {
      const ui = loadUiState();
      ui.currentTab = node.dataset.tab;
      saveUiState(ui);
      renderApp();
      if (window.innerWidth <= 980) {
        sidebar.classList.remove("open");
      }
    });
  });

  sidebar.querySelector("#period-select").addEventListener("change", (event) => {
    setActivePeriodId(event.target.value);
    renderApp();
  });
}

function getNavItems(role) {
  const adminSections = [
    { label: "Visão Geral", items: [{ key: "dashboard", name: "Dashboard", icon: "??" }, { key: "clients", name: "Clientes", icon: "??" }] },
    { label: "Cadastros", items: [{ key: "users", name: "Funcionários", icon: "?????" }, { key: "conference", name: "Conferência", icon: "??" }, { key: "statuses", name: "Status", icon: "??" }] },
    { label: "Importação", items: [{ key: "import", name: "Importar Planilha", icon: "??" }] },
    { label: "Períodos", items: [{ key: "periods", name: "Gerenciar Períodos", icon: "???" }] },
    { label: "Relatórios", items: [{ key: "weekly-report", name: "Relatório Semanal", icon: "??" }, { key: "custom-link", name: "Link Conferir", icon: "??" }] },
    { label: "Banco de Horas", items: [{ key: "hours", name: "Banco de Horas", icon: "??" }] },
    { label: "Notificações", items: [{ key: "notifications", name: "Notificações", icon: "??" }] }
  ];
  const employeeSections = [
    { label: "Visão Geral", items: [{ key: "dashboard", name: "Dashboard", icon: "??" }, { key: "clients", name: "Clientes", icon: "??" }] },
    { label: "Banco de Horas", items: [{ key: "hours", name: "Banco de Horas", icon: "??" }] },
    { label: "Notificações", items: [{ key: "notifications", name: "Notificações", icon: "??" }] }
  ];
  const conferenceSections = [
    { label: "Visão Geral", items: [{ key: "dashboard", name: "Dashboard", icon: "??" }, { key: "conference", name: "Conferência", icon: "??" }, { key: "clients", name: "Clientes", icon: "??" }] },
    { label: "Banco de Horas", items: [{ key: "hours", name: "Banco de Horas", icon: "??" }] },
    { label: "Notificações", items: [{ key: "notifications", name: "Notificações", icon: "??" }] }
  ];

  if (role === "admin") return adminSections;
  if (role === "conference") return conferenceSections;
  return employeeSections;
}

function getDefaultPage(user) {
  if (user.role === "admin") return "dashboard";
  if (user.role === "conference") return "conference";
  return "dashboard";
}
function renderCurrentPage(tab) {
  const currentUser = getCurrentUser();
  const content = document.querySelector("#page-content");

  switch (tab) {
    case "dashboard":
      renderDashboard(content, currentUser);
      break;
    case "clients":
      renderClientsPage(content, currentUser);
      break;
    case "conference":
      renderConferencePage(content, currentUser);
      break;
    case "users":
      renderUsersPage(content, currentUser);
      break;
    case "import":
      renderImportPage(content, currentUser);
      break;
    case "periods":
      renderPeriodsPage(content, currentUser);
      break;
    case "statuses":
      renderStatusesPage(content, currentUser);
      break;
    case "hours":
      renderHoursPage(content, currentUser);
      break;
    case "notifications":
      renderNotificationsPage(content, currentUser);
      break;
    case "weekly-report":
      renderWeeklyReportPage(content, currentUser);
      break;
    case "settings":
      renderSettingsPage(content, currentUser);
      break;
    case "custom-link":
      renderCustomLinkPage(content);
      break;
    default:
      content.innerHTML = `<div class="content-card">Página em construção.</div>`;
  }
}

function renderDashboard(content, user) {
  const period = getActivePeriod();
  const clients = getClientsForRole(user, period.id);
  const total = clients.length || 1;
  const completed = clients.filter((client) => isClientCompleted(client, period)).length;
  const inProgress = clients.filter((client) => !isClientCompleted(client, period) && progressPercent(client, period) > 0).length;
  const notStarted = clients.filter((client) => progressPercent(client, period) === 0).length;
  const stageMetrics = period.steps.map((step) => ({
    step,
    count: clients.filter((client) => client.progress?.find((item) => item.stepId === step.id)?.done).length
  }));
  const statusCounts = countByStatus(clients);

  content.innerHTML = `
    <div class="toolbar">
      <div>
        <h2>Dashboard</h2>
        <div class="muted">Visão geral do período ${period.name}</div>
      </div>
      <div class="row">
        ${user.role === "admin" ? `<button class="button secondary" id="dashboard-print">Imprimir</button>` : ""}
      </div>
    </div>
    <div class="metrics">
      <div class="metric-card"><div>Total de Clientes</div><strong>${clients.length}</strong><span class="muted">no período</span></div>
      <div class="metric-card"><div>Concluídos</div><strong>${completed}</strong><span class="muted">${Math.round((completed / total) * 100)}% do total</span></div>
      <div class="metric-card"><div>Em andamento</div><strong>${inProgress}</strong><span class="muted">clientes com etapas iniciadas</span></div>
      <div class="metric-card"><div>Não iniciados</div><strong>${notStarted}</strong><span class="muted">aguardando operação</span></div>
    </div>
    <div class="content-card">
      <div class="row" style="justify-content: space-between;"><strong>Progresso Geral do Período</strong><strong>${Math.round((completed / total) * 100)}%</strong></div>
      <div class="progress"><span style="width:${(completed / total) * 100}%"></span></div>
      <div class="muted">${completed} concluídos · ${inProgress} em andamento · ${notStarted} não iniciados</div>
    </div>
    <div class="grid-2">
      <div class="content-card">
        <h3>Progresso por Etapa</h3>
        <div class="stack">
          ${stageMetrics
            .map(
              ({ step, count }) => `
                <div>
                  <div class="row" style="justify-content: space-between;"><span>${step.name}</span><strong>${count}/${clients.length}</strong></div>
                  <div class="progress"><span style="width:${clients.length ? (count / clients.length) * 100 : 0}%"></span></div>
                </div>
              `
            )
            .join("")}
        </div>
      </div>
      <div class="content-card"><h3>Status das Declarações</h3><div class="chart-wrap"><canvas id="statusChart"></canvas></div></div>
    </div>
    <div class="grid-2">
      <div class="table-card">
        <h3>Clientes Recentes</h3>
        <table>
          <thead><tr><th>Cliente</th><th>Status</th><th>Responsável</th><th>Progresso</th></tr></thead>
          <tbody>
            ${clients
              .slice()
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 8)
              .map(
                (client) => `
                  <tr data-client-open="${client.id}">
                    <td>${client.name}<div class="muted">${client.cpf}</div></td>
                    <td>${renderStatusBadge(client.statusId)}</td>
                    <td>${userName(client.ownerId)}</td>
                    <td>${progressPercent(client, period)}%</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="content-card">
        <h3>${user.role === "admin" ? "Progresso por Funcionário" : "Resumo pessoal"}</h3>
        <div class="stack">
          ${user.role === "admin"
            ? state.users
                .filter((item) => item.role === "employee")
                .map((employee) => {
                  const employeeClients = state.clients.filter((client) => client.periodId === period.id && client.ownerId === employee.id);
                  return `
                    <div>
                      <div class="row" style="justify-content: space-between;"><span>${employee.name}</span><strong>${employeeClients.length}</strong></div>
                      <div class="progress"><span style="width:${employeeClients.length ? averageProgress(employeeClients, period) : 0}%"></span></div>
                    </div>
                  `;
                })
                .join("")
            : `
              <div class="hour-row"><strong>Meus clientes</strong><div class="muted">${clients.length} no período atual</div></div>
              <div class="hour-row"><strong>Minhas notificações</strong><div class="muted">${state.notifications.filter((item) => item.userId === user.id && !item.read).length} não lidas</div></div>
              <div class="hour-row"><strong>Progresso médio</strong><div class="muted">${Math.round(averageProgress(clients, period))}%</div></div>
            `}
        </div>
      </div>
    </div>
  `;

  attachClientOpenHandlers();
  renderStatusChart(statusCounts);

  const printButton = document.querySelector("#dashboard-print");
  if (printButton) printButton.addEventListener("click", () => window.print());
}

function renderClientsPage(content, user) {
  const period = getActivePeriod();
  const allClients = getClientsForRole(user, period.id);
  const statuses = state.statuses;

  content.innerHTML = `
    <div class="toolbar">
      <div>
        <h2>${user.role === "admin" ? "Clientes" : "Minha carteira"}</h2>
        <div class="muted">Tabela/lista com filtros, progresso por etapa, contatos e mensagens.</div>
      </div>
      <div class="row">${user.role === "admin" ? `<button class="button primary" id="new-client-btn">Novo cliente</button>` : ""}</div>
    </div>
    <div class="pill-bar" id="progress-pills">
      ${["todos", "nao iniciado", "em andamento", "concluido"]
        .map((pill) => `<button class="pill ${pill === "todos" ? "active" : ""}" data-progress-filter="${pill}">${pill}</button>`)
        .join("")}
    </div>
    <div class="table-card">
      <div class="filters">
        <label class="field" style="flex:1 1 260px;"><span>Busca por nome/CPF</span><input class="search-input" id="client-search" placeholder="Ex.: joao ou 123" /></label>
        <label class="field"><span>Status</span><select id="client-status-filter"><option value="">Todos</option>${statuses.map((status) => `<option value="${status.id}">${status.name}</option>`).join("")}</select></label>
        ${user.role === "admin"
          ? `
            <label class="field"><span>Responsável</span><select id="client-owner-filter"><option value="">Todos</option>${state.users.filter((item) => item.role === "employee").map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}</select></label>
            <label class="field"><span>Conferência</span><select id="client-conference-filter"><option value="">Todos</option>${state.users.filter((item) => item.role === "conference").map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}</select></label>
            <label class="field"><span>Grupo</span><input id="client-group-filter" placeholder="VIP, Regular..." /></label>
          `
          : ""}
      </div>
      <table>
        <thead><tr><th>Cliente</th><th>Responsável</th><th>Conferência</th><th>Grupo</th><th>Contato</th><th>Etapas</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody id="clients-table-body"></tbody>
      </table>
    </div>
  `;

  const filters = { progress: "todos", search: "", statusId: "", ownerId: "", conferenceId: "", group: "" };

  const renderTable = () => {
    const body = document.querySelector("#clients-table-body");
    const filtered = allClients.filter((client) => {
      const progress = progressPercent(client, period);
      const progressMatch = filters.progress === "todos" || (filters.progress === "nao iniciado" && progress === 0) || (filters.progress === "em andamento" && progress > 0 && progress < 100) || (filters.progress === "concluido" && progress === 100);
      const searchMatch = !filters.search || normalize(`${client.name} ${client.cpf}`).includes(normalize(filters.search));
      const statusMatch = !filters.statusId || client.statusId === filters.statusId;
      const ownerMatch = !filters.ownerId || client.ownerId === filters.ownerId;
      const conferenceMatch = !filters.conferenceId || client.conferenceIds.includes(filters.conferenceId);
      const groupMatch = !filters.group || normalize(client.group || "").includes(normalize(filters.group));
      return progressMatch && searchMatch && statusMatch && ownerMatch && conferenceMatch && groupMatch;
    });

    body.innerHTML = filtered
      .map((client) => {
        const primaryPhone = client.phones.find((phone) => phone.primary) || client.phones[0];
        const primaryEmail = client.emails.find((email) => email.primary) || client.emails[0];
        return `
          <tr data-client-open="${client.id}">
            <td><strong>${client.name}</strong><div class="muted">${client.cpf}</div></td>
            <td>${userName(client.ownerId)}</td>
            <td>${client.conferenceIds.map((id) => userName(id)).join(", ") || "-"}</td>
            <td>${client.group || "-"}</td>
            <td>
              ${primaryPhone ? `<a href="${whatsUrl(primaryPhone.number)}" target="_blank" rel="noreferrer">${formatPhone(primaryPhone.number)}</a>` : "-"}
              <div>${primaryEmail ? `<a href="mailto:${primaryEmail.email}">${primaryEmail.email}</a>` : client.legacyEmail ? `<a href="mailto:${client.legacyEmail}">${client.legacyEmail}</a>` : ""}</div>
            </td>
            <td><div class="progress"><span style="width:${progressPercent(client, period)}%"></span></div><div class="muted">${progressPercent(client, period)}%</div></td>
            <td>${user.role === "admin" ? renderStatusSelect(client) : renderStatusBadge(client.statusId)}${statusNoteLine(client)}</td>
            <td><div class="row">${user.role === "admin" ? `<button class="button-inline" data-client-edit="${client.id}">Editar</button>` : ""}${user.role === "admin" ? `<button class="button-inline" data-client-lock="${client.id}">${client.lockedBy ? "Unlock" : "Lock"}</button>` : ""}</div></td>
          </tr>
        `;
      })
      .join("");

    attachClientOpenHandlers();
    attachClientRowActions();
    attachStatusSelectHandlers();
  };

  renderTable();

  document.querySelectorAll("[data-progress-filter]").forEach((node) => {
    node.addEventListener("click", () => {
      filters.progress = node.dataset.progressFilter;
      document.querySelectorAll("[data-progress-filter]").forEach((pill) => pill.classList.remove("active"));
      node.classList.add("active");
      renderTable();
    });
  });

  document.querySelector("#client-search").addEventListener("input", (event) => { filters.search = event.target.value; renderTable(); });
  document.querySelector("#client-status-filter").addEventListener("change", (event) => { filters.statusId = event.target.value; renderTable(); });
  const ownerFilter = document.querySelector("#client-owner-filter");
  if (ownerFilter) ownerFilter.addEventListener("change", (event) => { filters.ownerId = event.target.value; renderTable(); });
  const conferenceFilter = document.querySelector("#client-conference-filter");
  if (conferenceFilter) conferenceFilter.addEventListener("change", (event) => { filters.conferenceId = event.target.value; renderTable(); });
  const groupFilter = document.querySelector("#client-group-filter");
  if (groupFilter) groupFilter.addEventListener("input", (event) => { filters.group = event.target.value; renderTable(); });
  const newButton = document.querySelector("#new-client-btn");
  if (newButton) newButton.addEventListener("click", () => openClientEditor());
}

function renderConferencePage(content, user) {
  const period = getActivePeriod();
  const items = state.clients.filter((client) => client.periodId === period.id && client.conferenceIds.includes(user.id));

  content.innerHTML = `
    <div class="toolbar"><div><h2>Conferência</h2><div class="muted">Fila exclusiva para revisores com status, busca por nome e visualização de mensagens.</div></div></div>
    <div class="table-card">
      <div class="filters">
        <label class="field" style="flex:1 1 220px;"><span>Buscar por nome/CPF</span><input id="conference-search" placeholder="Digite para filtrar" /></label>
        <label class="field"><span>Status</span><select id="conference-status"><option value="">Todos</option>${state.statuses.map((status) => `<option value="${status.id}">${status.name}</option>`).join("")}</select></label>
      </div>
      <table>
        <thead><tr><th>Cliente</th><th>Responsável</th><th>Status</th><th>Etapas</th><th>Mensagens</th></tr></thead>
        <tbody id="conference-body"></tbody>
      </table>
    </div>
  `;

  const filters = { search: "", statusId: "" };
  const draw = () => {
    document.querySelector("#conference-body").innerHTML = items
      .filter((client) => {
        const searchMatch = !filters.search || normalize(`${client.name} ${client.cpf}`).includes(normalize(filters.search));
        const statusMatch = !filters.statusId || client.statusId === filters.statusId;
        return searchMatch && statusMatch;
      })
      .map((client) => `
          <tr data-client-open="${client.id}">
            <td>${client.name}<div class="muted">${client.cpf}</div></td>
            <td>${userName(client.ownerId)}</td>
            <td>${renderStatusBadge(client.statusId)}</td>
            <td>${progressPercent(client, period)}%</td>
            <td>${client.messages.length}</td>
          </tr>
        `)
      .join("");
    attachClientOpenHandlers();
  };

  draw();
  document.querySelector("#conference-search").addEventListener("input", (event) => { filters.search = event.target.value; draw(); });
  document.querySelector("#conference-status").addEventListener("change", (event) => { filters.statusId = event.target.value; draw(); });
}

function renderUsersPage(content, user) {
  guardAdmin(user);
  content.innerHTML = `
    <div class="toolbar"><div><h2>Gerenciar Usuários</h2><div class="muted">CRUD de funcionários, revisores e administradores com senha visível no MVP.</div></div><button class="button primary" id="new-user-btn">Novo usuário</button></div>
    <div class="table-card">
      <table>
        <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Senha</th><th>Ações</th></tr></thead>
        <tbody>
          ${state.users
            .map(
              (item) => `
                <tr>
                  <td>${item.name}</td><td>${item.email}</td><td>${labelRole(item.role)}</td><td>${item.password}</td>
                  <td><div class="row"><button class="button-inline" data-user-edit="${item.id}">Editar</button>${item.role !== "admin" ? `<button class="button-inline" data-user-delete="${item.id}">Excluir</button>` : ""}</div></td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  document.querySelector("#new-user-btn").addEventListener("click", () => openUserEditor());
  document.querySelectorAll("[data-user-edit]").forEach((node) => node.addEventListener("click", (event) => { event.stopPropagation(); openUserEditor(node.dataset.userEdit); }));
  document.querySelectorAll("[data-user-delete]").forEach((node) => node.addEventListener("click", (event) => { event.stopPropagation(); if (confirm("Excluir usuário?")) { state.users = state.users.filter((item) => item.id !== node.dataset.userDelete); saveState(); renderApp(); } }));
}

function renderImportPage(content, user) {
  guardAdmin(user);
  content.innerHTML = `
    <div class="grid-2">
      <div class="form-card">
        <h2>Importação de Clientes</h2>
        <p class="muted">Aceita .csv nativo e .xlsx via SheetJS. Mapeamento esperado: Nome, Responsável, Conferência, Referência de Contato, Telefone e CPF.</p>
        <div class="stack">
          <label class="field"><span>Arquivo</span><input type="file" id="import-file" accept=".csv,.xlsx,.xls" /></label>
          <label class="field"><span>Clientes existentes</span><select id="import-mode"><option value="skip">Pular existentes</option><option value="overwrite">Sobrescrever existentes</option></select></label>
          <button class="button primary" id="import-btn">Processar importação</button>
        </div>
      </div>
      <div class="content-card">
        <h3>Regras do MVP</h3>
        <div class="stack">
          <div class="hour-row">Responsável não encontrado: permite vincular a um usuário existente ou criar automaticamente.</div>
          <div class="hour-row">Telefone inválido: o sistema pergunta se deseja corrigir na hora.</div>
          <div class="hour-row">Conferência aceita múltiplos revisores separados por vírgula.</div>
        </div>
      </div>
    </div>
    <div class="table-card"><h3>Log da importação</h3><div id="import-log" class="stack"><div class="muted">Nenhuma importação executada.</div></div></div>
  `;

  document.querySelector("#import-btn").addEventListener("click", async () => {
    const fileInput = document.querySelector("#import-file");
    const file = fileInput.files?.[0];
    const mode = document.querySelector("#import-mode").value;
    const log = document.querySelector("#import-log");
    if (!file) {
      log.innerHTML = `<div class="hour-row">Selecione um arquivo primeiro.</div>`;
      return;
    }

    try {
      const rows = await parseImportFile(file);
      const result = importClients(rows, mode);
      log.innerHTML = result.logs.map((item) => `<div class="hour-row">${item}</div>`).join("");
      saveState();
      renderApp();
    } catch (error) {
      log.innerHTML = `<div class="hour-row">Falha ao importar: ${error.message}</div>`;
    }
  });
}
function renderPeriodsPage(content, user) {
  guardAdmin(user);
  content.innerHTML = `
    <div class="toolbar"><div><h2>Gerenciar Períodos</h2><div class="muted">CRUD de períodos com etapas próprias e opção de copiar clientes e/ou etapas.</div></div><button class="button primary" id="new-period-btn">Novo período</button></div>
    <div class="table-card">
      <table>
        <thead><tr><th>Nome</th><th>Ano</th><th>Clientes</th><th>Etapas</th><th>Funcionários Ativos</th><th>Ações</th></tr></thead>
        <tbody>
          ${state.periods
            .map((period) => {
              const employeeCount = state.users.filter((userItem) => userItem.role !== "admin" && userItem.activeByPeriod?.[period.id] !== false).length;
              return `
                <tr>
                  <td>${period.name}</td><td>${period.year}</td><td>${state.clients.filter((client) => client.periodId === period.id).length}</td><td>${period.steps.length}</td><td>${employeeCount}</td>
                  <td><div class="row"><button class="button-inline" data-period-edit="${period.id}">Editar</button><button class="button-inline" data-period-delete="${period.id}">Excluir</button></div></td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  document.querySelector("#new-period-btn").addEventListener("click", () => openPeriodEditor());
  document.querySelectorAll("[data-period-edit]").forEach((node) => node.addEventListener("click", () => openPeriodEditor(node.dataset.periodEdit)));
  document.querySelectorAll("[data-period-delete]").forEach((node) => node.addEventListener("click", () => {
    const id = node.dataset.periodDelete;
    if (confirm("Excluir período? Isso removerá os clientes do período.")) {
      state.periods = state.periods.filter((item) => item.id !== id);
      state.clients = state.clients.filter((client) => client.periodId !== id);
      if (getActivePeriodId() === id) setActivePeriodId(state.periods[0]?.id || null);
      saveState();
      renderApp();
    }
  }));
}

function renderStatusesPage(content, user) {
  guardAdmin(user);
  content.innerHTML = `
    <div class="toolbar"><div><h2>Status da Declaração</h2><div class="muted">Status personalizados com cor, badge dinâmica e OUTROS fixo ao final.</div></div><button class="button primary" id="new-status-btn">Novo status</button></div>
    <div class="table-card">
      <table>
        <thead><tr><th>Status</th><th>Cor</th><th>Visual</th><th>Ações</th></tr></thead>
        <tbody>
          ${sortedStatuses().map((status) => `
              <tr>
                <td>${status.name}</td><td>${status.color}</td><td>${renderStatusBadge(status.id)}</td>
                <td><div class="row"><button class="button-inline" data-status-edit="${status.id}">Editar</button>${status.fixed ? "" : `<button class="button-inline" data-status-delete="${status.id}">Excluir</button>`}</div></td>
              </tr>
            `).join("")}
        </tbody>
      </table>
    </div>
  `;

  document.querySelector("#new-status-btn").addEventListener("click", () => openStatusEditor());
  document.querySelectorAll("[data-status-edit]").forEach((node) => node.addEventListener("click", () => openStatusEditor(node.dataset.statusEdit)));
  document.querySelectorAll("[data-status-delete]").forEach((node) => node.addEventListener("click", () => { if (confirm("Excluir status?")) { state.statuses = state.statuses.filter((item) => item.id !== node.dataset.statusDelete); saveState(); renderApp(); } }));
}

function renderHoursPage(content, user) {
  const entries = user.role === "admin" ? state.hourEntries : state.hourEntries.filter((item) => item.userId === user.id);
  const monthDefault = new Date().toISOString().slice(0, 7);

  content.innerHTML = `
    <div class="toolbar"><div><h2>Banco de Horas</h2><div class="muted">Registro por data, entrada, saída e descrição com cálculo automático.</div></div>${user.role !== "admin" ? `<button class="button primary" id="new-hour-btn">Novo registro</button>` : ""}</div>
    <div class="filters"><label class="field"><span>Mês</span><input type="month" id="hours-month" value="${monthDefault}" /></label></div>
    <div id="hours-content"></div>
  `;

  const draw = () => {
    const month = document.querySelector("#hours-month").value;
    const monthEntries = entries.filter((item) => item.date.startsWith(month));
    const target = document.querySelector("#hours-content");

    if (user.role === "admin") {
      const grouped = state.users.filter((item) => item.role !== "admin").map((userItem) => {
        const userEntries = monthEntries.filter((entry) => entry.userId === userItem.id);
        return { userItem, userEntries, total: userEntries.reduce((sum, entry) => sum + hoursBetween(entry.start, entry.end), 0) };
      }).sort((a, b) => b.total - a.total);

      target.innerHTML = `
        <div class="report-summary"><strong>Total acumulado do mês</strong><div>${grouped.reduce((sum, item) => sum + item.total, 0).toFixed(2)} horas</div></div>
        <div class="stack">
          ${grouped.map(({ userItem, userEntries, total }) => `
            <div class="content-card">
              <div class="row" style="justify-content: space-between;"><strong>${userItem.name}</strong><span>${total.toFixed(2)} horas</span></div>
              <div class="stack">
                ${userEntries.sort((a, b) => hoursBetween(b.start, b.end) - hoursBetween(a.start, a.end)).map((entry) => `
                  <div class="hour-row">${entry.date} · ${entry.start} às ${entry.end} · ${hoursBetween(entry.start, entry.end).toFixed(2)}h<div class="muted">${entry.description}</div></div>
                `).join("") || `<div class="hour-row">Sem registros no mês.</div>`}
              </div>
            </div>
          `).join("")}
        </div>
      `;
      return;
    }

    target.innerHTML = `
      <div class="report-summary"><strong>Total acumulado</strong><div>${monthEntries.reduce((sum, item) => sum + hoursBetween(item.start, item.end), 0).toFixed(2)} horas</div></div>
      <div class="table-card">
        <table>
          <thead><tr><th>Data</th><th>Entrada</th><th>Saída</th><th>Total</th><th>Descrição</th><th>Ações</th></tr></thead>
          <tbody>
            ${monthEntries.map((entry) => `
              <tr>
                <td>${entry.date}</td><td>${entry.start}</td><td>${entry.end}</td><td>${hoursBetween(entry.start, entry.end).toFixed(2)}h</td><td>${entry.description}</td>
                <td><div class="row"><button class="button-inline" data-hour-edit="${entry.id}">Editar</button><button class="button-inline" data-hour-delete="${entry.id}">Excluir</button></div></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    document.querySelectorAll("[data-hour-edit]").forEach((node) => node.addEventListener("click", () => openHourEditor(node.dataset.hourEdit)));
    document.querySelectorAll("[data-hour-delete]").forEach((node) => node.addEventListener("click", () => { state.hourEntries = state.hourEntries.filter((item) => item.id !== node.dataset.hourDelete); saveState(); draw(); }));
  };

  draw();
  document.querySelector("#hours-month").addEventListener("change", draw);
  const newButton = document.querySelector("#new-hour-btn");
  if (newButton) newButton.addEventListener("click", () => openHourEditor());
}

function renderNotificationsPage(content, user) {
  const items = state.notifications.filter((item) => item.userId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  content.innerHTML = `
    <div class="toolbar"><div><h2>Notificações</h2><div class="muted">Atualização em tempo real no MVP via estado local compartilhado.</div></div><div class="row"><button class="button secondary" id="mark-read-btn">Marcar todas como lidas</button><button class="button danger" id="clear-notifications-btn">Limpar tudo</button></div></div>
    <div class="stack">
      ${items.map((item) => `
          <div class="content-card">
            <div class="row" style="justify-content: space-between;"><strong>${item.title}</strong><span class="muted">${new Date(item.createdAt).toLocaleString("pt-BR")}</span></div>
            <div>${item.text}</div><div class="muted">${item.read ? "Lida" : "Não lida"}</div>
          </div>
        `).join("") || `<div class="content-card">Sem notificações.</div>`}
    </div>
  `;

  document.querySelector("#mark-read-btn").addEventListener("click", () => { state.notifications.forEach((item) => { if (item.userId === user.id) item.read = true; }); saveState(); renderApp(); });
  document.querySelector("#clear-notifications-btn").addEventListener("click", () => { state.notifications = state.notifications.filter((item) => item.userId !== user.id); saveState(); renderApp(); });
}

function renderWeeklyReportPage(content, user) {
  guardAdmin(user);
  const period = getActivePeriod();
  const employeeUsers = state.users.filter((item) => item.role === "employee");
  const deliveredStatus = state.statuses.find((item) => item.name === "ENTREGUE");
  const transmittedStatus = state.statuses.find((item) => item.name === "TRANSMITIDA");
  const totalClients = state.clients.filter((client) => client.periodId === period.id).length || 1;

  const rows = employeeUsers.map((employee) => {
    const clients = state.clients.filter((client) => client.periodId === period.id && client.ownerId === employee.id);
    const transmitted = clients.filter((client) => client.statusId === transmittedStatus?.id).length;
    const delivered = clients.filter((client) => client.statusId === deliveredStatus?.id).length;
    const inTyping = clients.filter((client) => statusName(client.statusId) === "EM DIGITACAO").length;
    const todo = clients.filter((client) => statusName(client.statusId) === "PENDENTE").length;
    const totalHours = state.hourEntries.filter((entry) => entry.userId === employee.id).reduce((sum, entry) => sum + hoursBetween(entry.start, entry.end), 0);
    return { employee, transmitted, delivered, inTyping, todo, total: clients.length, totalHours };
  });

  content.innerHTML = `
    <div class="toolbar"><div><h2>Relatório Semanal</h2><div class="muted">Página exclusiva do administrador com impressão otimizada.</div></div><button class="button primary" id="weekly-print-btn">Imprimir</button></div>
    <div class="report-summary"><strong>Período selecionado</strong><div>${period.name}</div><div class="muted">Total acumulado: ${rows.reduce((sum, item) => sum + item.total, 0)} clientes · Média por operador: ${(rows.reduce((sum, item) => sum + item.total, 0) / (rows.length || 1)).toFixed(1)}</div></div>
    <div class="table-card"><h3>Controle por Operador</h3><table><thead><tr><th>Operador</th><th>Transmitidas</th><th>Entregues</th><th>Em Digitação</th><th>A Fazer</th><th>Total</th><th>Carga Horária</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${row.employee.name}</td><td>${row.transmitted}</td><td>${row.delivered}</td><td>${row.inTyping}</td><td>${row.todo}</td><td>${row.total}</td><td>${row.totalHours.toFixed(2)}h</td></tr>`).join("")}</tbody></table></div>
    <div class="table-card"><h3>Indicadores Acumulados</h3><table><thead><tr><th>Funcionário</th><th>% Entregues</th><th>% Transmitidas</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${row.employee.name}</td><td>${((row.delivered / (row.total || 1)) * 100).toFixed(1)}%</td><td>${((row.transmitted / (row.total || 1)) * 100).toFixed(1)}%</td></tr>`).join("")}<tr><td><strong>GERAL</strong></td><td><strong>${((rows.reduce((sum, row) => sum + row.delivered, 0) / totalClients) * 100).toFixed(1)}%</strong></td><td><strong>${((rows.reduce((sum, row) => sum + row.transmitted, 0) / totalClients) * 100).toFixed(1)}%</strong></td></tr></tbody></table></div>
    <div class="table-card"><h3>Clientes ENTREGUE aguardando transmissão</h3><table><thead><tr><th>Cliente</th><th>Responsável</th><th>Contato</th><th>Status</th></tr></thead><tbody>${state.clients.filter((client) => client.periodId === period.id && client.statusId === deliveredStatus?.id).map((client) => { const primaryPhone = client.phones.find((phone) => phone.primary) || client.phones[0]; return `<tr data-client-open="${client.id}"><td>${client.name}</td><td>${userName(client.ownerId)}</td><td>${primaryPhone ? formatPhone(primaryPhone.number) : "-"}</td><td>${renderStatusBadge(client.statusId)}</td></tr>`; }).join("") || `<tr><td colspan="4">Nenhum cliente neste status.</td></tr>`}</tbody></table></div>
  `;

  attachClientOpenHandlers();
  document.querySelector("#weekly-print-btn").addEventListener("click", printWeeklyReport);
}

function renderSettingsPage(content, user) {
  content.innerHTML = `
    <div class="grid-2">
      <div class="form-card"><h2>Configurações</h2><p class="muted">Modo escuro persistido e link customizável.</p><div class="stack"><label class="field"><span>Modo visual</span><select id="settings-theme"><option value="light" ${state.settings.theme === "light" ? "selected" : ""}>Claro</option><option value="dark" ${state.settings.theme === "dark" ? "selected" : ""}>Escuro</option></select></label><label class="field"><span>Link customizável</span><input id="settings-link" value="${state.settings.customReportLink || ""}" /></label><button class="button primary" id="save-settings-btn">Salvar configurações</button></div></div>
      <div class="content-card"><h3>Resumo do usuário</h3><div class="stack"><div class="hour-row">Nome: ${user.name}</div><div class="hour-row">Papel: ${labelRole(user.role)}</div><div class="hour-row">Período ativo: ${getActivePeriod()?.name || "-"}</div></div></div>
    </div>
  `;

  document.querySelector("#save-settings-btn").addEventListener("click", () => {
    state.settings.theme = document.querySelector("#settings-theme").value;
    state.settings.customReportLink = document.querySelector("#settings-link").value;
    saveState();
    applyTheme();
    renderApp();
  });
}

function renderCustomLinkPage(content) {
  content.innerHTML = `
    <div class="content-card"><h2>Link Conferir</h2><p class="muted">Atalho configurável pelo administrador.</p><a class="button primary" href="${state.settings.customReportLink || "#"}" target="_blank" rel="noreferrer">Abrir link</a></div>
  `;
}

function openModal(innerHtml) {
  const modal = document.querySelector("#modal-root");
  modal.innerHTML = `<div class="modal-card">${innerHtml}</div>`;
  modal.classList.add("open");
}

function closeModal() {
  const modal = document.querySelector("#modal-root");
  modal.classList.remove("open");
  modal.innerHTML = "";
}

function attachModalClose(selector = "[data-modal-close]") {
  document.querySelectorAll(selector).forEach((node) => node.addEventListener("click", closeModal));
}

function attachClientOpenHandlers() {
  document.querySelectorAll("[data-client-open]").forEach((row) => {
    row.addEventListener("click", () => openClientDetail(row.dataset.clientOpen));
  });
}

function attachClientRowActions() {
  document.querySelectorAll("[data-client-edit]").forEach((node) => node.addEventListener("click", (event) => { event.stopPropagation(); openClientEditor(node.dataset.clientEdit); }));
  document.querySelectorAll("[data-client-lock]").forEach((node) => node.addEventListener("click", (event) => {
    event.stopPropagation();
    const client = state.clients.find((item) => item.id === node.dataset.clientLock);
    const currentUser = getCurrentUser();
    client.lockedBy = client.lockedBy ? null : currentUser.id;
    saveState();
    renderApp();
  }));
}

function attachStatusSelectHandlers() {
  document.querySelectorAll("[data-status-select]").forEach((select) => {
    select.addEventListener("change", (event) => {
      const client = state.clients.find((item) => item.id === select.dataset.clientId);
      client.statusId = event.target.value;
      if (statusName(event.target.value) === "OUTROS") {
        client.statusNote = prompt("Descreva a observação para OUTROS:", client.statusNote || "") || "";
      }
      saveState();
      renderApp();
    });
  });
}
function openClientDetail(clientId) {
  const user = getCurrentUser();
  const client = state.clients.find((item) => item.id === clientId);
  const period = state.periods.find((item) => item.id === client.periodId);

  openModal(`
    <div class="modal-header"><div><h2>${client.name}</h2><div class="muted">${client.cpf} · ${statusName(client.statusId)}</div></div><button class="button secondary" data-modal-close>Fechar</button></div>
    <div class="grid-2">
      <div class="stack">
        <div class="content-card"><h3>Informações</h3><div class="contact-list"><div class="contact-item">Responsável: ${userName(client.ownerId)}</div><div class="contact-item">Conferência: ${client.conferenceIds.map((id) => userName(id)).join(", ") || "-"}</div><div class="contact-item">Grupo: ${client.group || "-"}</div><div class="contact-item">Referência de contato: ${client.contactReference || "-"}</div></div></div>
        <div class="content-card"><h3>Etapas clicáveis</h3><div class="timeline">${period.steps.map((step) => { const progressItem = client.progress.find((item) => item.stepId === step.id); return `<button class="timeline-item" data-step-toggle="${client.id}" data-step-id="${step.id}">${progressItem?.done ? "?" : "?"} ${step.name}</button>`; }).join("")}</div></div>
      </div>
      <div class="stack">
        <div class="content-card"><h3>Contatos</h3><div class="contact-list">${client.phones.map((phone) => `<div class="contact-item">${phone.primary ? "Principal · " : ""}<a href="${whatsUrl(phone.number)}" target="_blank" rel="noreferrer">${phone.label}: ${formatPhone(phone.number)}</a></div>`).join("")}${client.emails.map((mail) => `<div class="contact-item">${mail.primary ? "Principal · " : ""}<a href="mailto:${mail.email}">${mail.label}: ${mail.email}</a></div>`).join("")}${client.legacyEmail && !client.emails.length ? `<div class="contact-item"><a href="mailto:${client.legacyEmail}">${client.legacyEmail}</a></div>` : ""}</div></div>
        <div class="content-card"><h3>Observações</h3><label class="field"><textarea id="client-notes">${client.notes || ""}</textarea></label></div>
        <div class="content-card"><h3>Mensagens / Pendências</h3><div class="message-list">${client.messages.map((message) => `<div class="message-item"><strong>${userName(message.fromUserId)}</strong><div>${message.text}</div>${message.attachmentName ? `<div class="muted">Anexo: ${message.attachmentName}</div>` : ""}</div>`).join("") || `<div class="message-item">Sem mensagens.</div>`}</div>${user.role !== "conference" || client.conferenceIds.includes(user.id) ? `<div class="stack"><label class="field"><span>Nova mensagem</span><textarea id="client-message-text" placeholder="Descreva a pendência"></textarea></label><label class="field"><span>Anexo (nome)</span><input id="client-message-attachment" placeholder="ex.: comprovante.pdf" /></label><button class="button primary" id="send-client-message">Enviar mensagem</button></div>` : ""}</div>
      </div>
    </div>
  `);

  attachModalClose();
  document.querySelectorAll("[data-step-toggle]").forEach((node) => node.addEventListener("click", () => {
    const targetClient = state.clients.find((item) => item.id === node.dataset.stepToggle);
    const stepItem = targetClient.progress.find((item) => item.stepId === node.dataset.stepId);
    stepItem.done = !stepItem.done;
    saveState();
    openClientDetail(clientId);
  }));
  document.querySelector("#client-notes").addEventListener("change", (event) => { client.notes = event.target.value; saveState(); });
  const sendMessage = document.querySelector("#send-client-message");
  if (sendMessage) {
    sendMessage.addEventListener("click", () => {
      const text = document.querySelector("#client-message-text").value.trim();
      const attachmentName = document.querySelector("#client-message-attachment").value.trim();
      if (!text) return;
      client.messages.push({ id: uid(), fromUserId: user.id, text, attachmentName, createdAt: nowIso() });
      client.conferenceIds.forEach((reviewerId) => notify(reviewerId, "Nova mensagem de cliente", `${client.name}: ${text}`));
      saveState();
      openClientDetail(clientId);
      renderApp();
    });
  }
}

function openClientEditor(clientId) {
  const client = state.clients.find((item) => item.id === clientId);
  const period = getActivePeriod();
  const isEdit = Boolean(client);
  const ownerOptions = state.users.filter((user) => user.role === "employee");
  const conferenceOptions = state.users.filter((user) => user.role === "conference");

  openModal(`
    <div class="modal-header"><div><h2>${isEdit ? "Editar cliente" : "Novo cliente"}</h2><div class="muted">${period.name}</div></div><button class="button secondary" data-modal-close>Fechar</button></div>
    <form id="client-editor-form" class="stack">
      <div class="split"><label class="field"><span>Nome</span><input name="name" value="${client?.name || ""}" required /></label><label class="field"><span>CPF</span><input name="cpf" value="${client?.cpf || ""}" required /></label></div>
      <div class="split"><label class="field"><span>Responsável</span><select name="ownerId">${ownerOptions.map((item) => `<option value="${item.id}" ${client?.ownerId === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label><label class="field"><span>Grupo</span><input name="group" value="${client?.group || ""}" /></label></div>
      <label class="field"><span>Conferência (múltipla)</span><select name="conferenceIds" multiple>${conferenceOptions.map((item) => `<option value="${item.id}" ${client?.conferenceIds?.includes(item.id) ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
      <label class="field"><span>Referência de contato</span><input name="contactReference" value="${client?.contactReference || ""}" /></label>
      <div class="grid-2"><div class="content-card"><h3>Telefones</h3><div id="phones-editor" class="stack"></div><button type="button" class="button secondary" id="add-phone-btn">Adicionar telefone</button></div><div class="content-card"><h3>E-mails</h3><div id="emails-editor" class="stack"></div><button type="button" class="button secondary" id="add-email-btn">Adicionar e-mail</button></div></div>
      <label class="field"><span>Observações</span><textarea name="notes">${client?.notes || ""}</textarea></label>
      <div class="modal-actions"><button class="button primary" type="submit">Salvar</button>${isEdit ? `<button class="button danger" type="button" id="delete-client-btn">Excluir</button>` : ""}</div>
    </form>
  `);

  attachModalClose();
  const phonesRoot = document.querySelector("#phones-editor");
  const emailsRoot = document.querySelector("#emails-editor");
  const phoneItems = client?.phones?.length ? structuredClone(client.phones) : [{ id: uid(), label: "WhatsApp", number: "", primary: true }];
  const emailItems = client?.emails?.length ? structuredClone(client.emails) : [{ id: uid(), label: "Principal", email: "", primary: true }];

  const drawPhones = () => {
    phonesRoot.innerHTML = phoneItems.map((phone) => `
      <div class="contact-item">
        <div class="split"><label class="field"><span>Nome</span><input data-phone-label="${phone.id}" value="${phone.label}" /></label><label class="field"><span>Número</span><input data-phone-number="${phone.id}" value="${phone.number}" /></label></div>
        <label><input type="radio" name="phone-primary" value="${phone.id}" ${phone.primary ? "checked" : ""} /> contato principal</label>
      </div>
    `).join("");
    phonesRoot.querySelectorAll("[data-phone-label]").forEach((node) => node.addEventListener("input", () => { phoneItems.find((item) => item.id === node.dataset.phoneLabel).label = node.value; }));
    phonesRoot.querySelectorAll("[data-phone-number]").forEach((node) => node.addEventListener("input", () => { phoneItems.find((item) => item.id === node.dataset.phoneNumber).number = node.value; }));
    phonesRoot.querySelectorAll("[name='phone-primary']").forEach((node) => node.addEventListener("change", () => { phoneItems.forEach((item) => { item.primary = item.id === node.value; }); drawPhones(); }));
  };

  const drawEmails = () => {
    emailsRoot.innerHTML = emailItems.map((mail) => `
      <div class="contact-item">
        <div class="split"><label class="field"><span>Nome</span><input data-email-label="${mail.id}" value="${mail.label}" /></label><label class="field"><span>E-mail</span><input data-email-value="${mail.id}" value="${mail.email}" /></label></div>
        <label><input type="radio" name="email-primary" value="${mail.id}" ${mail.primary ? "checked" : ""} /> e-mail principal</label>
      </div>
    `).join("");
    emailsRoot.querySelectorAll("[data-email-label]").forEach((node) => node.addEventListener("input", () => { emailItems.find((item) => item.id === node.dataset.emailLabel).label = node.value; }));
    emailsRoot.querySelectorAll("[data-email-value]").forEach((node) => node.addEventListener("input", () => { emailItems.find((item) => item.id === node.dataset.emailValue).email = node.value; }));
    emailsRoot.querySelectorAll("[name='email-primary']").forEach((node) => node.addEventListener("change", () => { emailItems.forEach((item) => { item.primary = item.id === node.value; }); drawEmails(); }));
  };

  drawPhones();
  drawEmails();
  document.querySelector("#add-phone-btn").addEventListener("click", () => { phoneItems.push({ id: uid(), label: "Novo telefone", number: "", primary: false }); drawPhones(); });
  document.querySelector("#add-email-btn").addEventListener("click", () => { emailItems.push({ id: uid(), label: "Novo e-mail", email: "", primary: false }); drawEmails(); });

  document.querySelector("#client-editor-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const conferenceIds = Array.from(event.currentTarget.querySelector("[name='conferenceIds']").selectedOptions).map((option) => option.value);
    const previousOwnerId = client?.ownerId;
    const next = client || { id: uid(), periodId: period.id, progress: period.steps.map((step) => ({ stepId: step.id, done: false })), messages: [], statusId: state.statuses[0].id, statusNote: "", lockedBy: null, createdAt: nowIso() };
    next.name = String(form.get("name") || "");
    next.cpf = String(form.get("cpf") || "");
    next.ownerId = String(form.get("ownerId") || "");
    next.group = String(form.get("group") || "");
    next.contactReference = String(form.get("contactReference") || "");
    next.conferenceIds = conferenceIds;
    next.phones = phoneItems.filter((item) => item.number.trim());
    next.emails = emailItems.filter((item) => item.email.trim());
    next.legacyEmail = next.legacyEmail || next.emails[0]?.email || "";
    next.notes = String(form.get("notes") || "");

    if (!client) {
      state.clients.push(next);
      notify(next.ownerId, "Novo cliente cadastrado", `${next.name} foi atribuído a você.`);
    } else if (previousOwnerId !== next.ownerId) {
      notify(next.ownerId, "Cliente transferido", `${next.name} foi transferido para sua carteira.`);
    }

    saveState();
    closeModal();
    renderApp();
  });

  const deleteButton = document.querySelector("#delete-client-btn");
  if (deleteButton) deleteButton.addEventListener("click", () => { if (confirm("Excluir cliente?")) { state.clients = state.clients.filter((item) => item.id !== client.id); saveState(); closeModal(); renderApp(); } });
}

function openUserEditor(userId) {
  const user = state.users.find((item) => item.id === userId);
  openModal(`
    <div class="modal-header"><div><h2>${user ? "Editar usuário" : "Novo usuário"}</h2><div class="muted">Senha padrão sugerida: primeironome+123</div></div><button class="button secondary" data-modal-close>Fechar</button></div>
    <form id="user-editor-form" class="stack">
      <div class="split"><label class="field"><span>Nome</span><input name="name" value="${user?.name || ""}" required /></label><label class="field"><span>E-mail</span><input name="email" value="${user?.email || ""}" required type="email" /></label></div>
      <div class="split"><label class="field"><span>Papel</span><select name="role">${["employee", "conference", "admin"].map((role) => `<option value="${role}" ${user?.role === role ? "selected" : ""}>${labelRole(role)}</option>`).join("")}</select></label><label class="field"><span>Senha</span><input name="password" value="${user?.password || ""}" required /></label></div>
      <button class="button primary" type="submit">Salvar</button>
    </form>
  `);
  attachModalClose();
  document.querySelector("#user-editor-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = user || { id: uid(), activeByPeriod: {} };
    next.name = String(form.get("name"));
    next.email = String(form.get("email")).toLowerCase();
    next.role = String(form.get("role"));
    next.password = String(form.get("password"));
    if (!user) state.users.push(next);
    saveState();
    closeModal();
    renderApp();
  });
}
function openPeriodEditor(periodId) {
  const period = state.periods.find((item) => item.id === periodId);
  const previous = state.periods[state.periods.length - 1];
  const steps = period?.steps?.length ? structuredClone(period.steps) : [{ id: uid(), name: "Contato Inicial" }];
  openModal(`
    <div class="modal-header"><div><h2>${period ? "Editar período" : "Novo período"}</h2></div><button class="button secondary" data-modal-close>Fechar</button></div>
    <form id="period-editor-form" class="stack">
      <div class="split"><label class="field"><span>Nome</span><input name="name" value="${period?.name || ""}" required /></label><label class="field"><span>Ano</span><input name="year" value="${period?.year || new Date().getFullYear()}" required type="number" /></label></div>
      ${!period ? `<div class="split"><label><input type="checkbox" name="copySteps" checked /> Copiar etapas do período anterior</label><label><input type="checkbox" name="copyClients" /> Copiar clientes do período anterior</label></div>` : ""}
      <div class="content-card"><div class="row" style="justify-content: space-between;"><strong>Etapas</strong><button type="button" class="button secondary" id="add-step-btn">Adicionar etapa</button></div><div id="steps-editor" class="stack"></div></div>
      <button class="button primary" type="submit">Salvar período</button>
    </form>
  `);
  attachModalClose();

  const root = document.querySelector("#steps-editor");
  const draw = () => {
    root.innerHTML = steps.map((step, index) => `
      <div class="contact-item"><div class="row"><input data-step-name="${step.id}" value="${step.name}" style="flex:1;" /><button type="button" class="button-inline" data-step-up="${step.id}" ${index === 0 ? "disabled" : ""}>?</button><button type="button" class="button-inline" data-step-down="${step.id}" ${index === steps.length - 1 ? "disabled" : ""}>?</button><button type="button" class="button-inline" data-step-remove="${step.id}">Remover</button></div></div>
    `).join("");
    root.querySelectorAll("[data-step-name]").forEach((node) => node.addEventListener("input", () => { steps.find((item) => item.id === node.dataset.stepName).name = node.value; }));
    root.querySelectorAll("[data-step-up]").forEach((node) => node.addEventListener("click", () => moveStep(node.dataset.stepUp, -1)));
    root.querySelectorAll("[data-step-down]").forEach((node) => node.addEventListener("click", () => moveStep(node.dataset.stepDown, 1)));
    root.querySelectorAll("[data-step-remove]").forEach((node) => node.addEventListener("click", () => { const idx = steps.findIndex((item) => item.id === node.dataset.stepRemove); steps.splice(idx, 1); draw(); }));
  };

  function moveStep(id, offset) {
    const index = steps.findIndex((item) => item.id === id);
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= steps.length) return;
    [steps[index], steps[nextIndex]] = [steps[nextIndex], steps[index]];
    draw();
  }

  draw();
  document.querySelector("#add-step-btn").addEventListener("click", () => { steps.push({ id: uid(), name: "Nova etapa" }); draw(); });
  document.querySelector("#period-editor-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = period || { id: uid(), createdAt: nowIso(), steps: [] };
    next.name = String(form.get("name"));
    next.year = Number(form.get("year"));
    next.steps = steps;

    if (!period) {
      const copySteps = form.get("copySteps") === "on";
      const copyClients = form.get("copyClients") === "on";
      if (copySteps && previous) next.steps = structuredClone(previous.steps).map((step) => ({ ...step, id: uid() }));
      state.periods.push(next);
      if (copyClients && previous) {
        const prevClients = state.clients.filter((client) => client.periodId === previous.id);
        prevClients.forEach((client) => {
          state.clients.push({ ...structuredClone(client), id: uid(), periodId: next.id, progress: next.steps.map((step) => ({ stepId: step.id, done: false })), messages: [], createdAt: nowIso() });
        });
      }
    }

    saveState();
    setActivePeriodId(next.id);
    closeModal();
    renderApp();
  });
}

function openStatusEditor(statusId) {
  const status = state.statuses.find((item) => item.id === statusId);
  openModal(`
    <div class="modal-header"><div><h2>${status ? "Editar status" : "Novo status"}</h2></div><button class="button secondary" data-modal-close>Fechar</button></div>
    <form id="status-editor-form" class="stack"><label class="field"><span>Nome</span><input name="name" value="${status?.name || ""}" required /></label><label class="field"><span>Cor</span><input name="color" type="color" value="${status?.color || "#2d7ff9"}" /></label><button class="button primary" type="submit">Salvar</button></form>
  `);
  attachModalClose();
  document.querySelector("#status-editor-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = status || { id: uid() };
    next.name = String(form.get("name")).toUpperCase();
    next.color = String(form.get("color"));
    if (!status) state.statuses.push(next);
    saveState();
    closeModal();
    renderApp();
  });
}

function openHourEditor(entryId) {
  const user = getCurrentUser();
  const entry = state.hourEntries.find((item) => item.id === entryId);
  openModal(`
    <div class="modal-header"><div><h2>${entry ? "Editar registro" : "Novo registro"}</h2></div><button class="button secondary" data-modal-close>Fechar</button></div>
    <form id="hour-editor-form" class="stack"><div class="split"><label class="field"><span>Data</span><input name="date" type="date" value="${entry?.date || new Date().toISOString().slice(0, 10)}" required /></label><label class="field"><span>Entrada</span><input name="start" type="time" value="${entry?.start || "08:00"}" required /></label></div><div class="split"><label class="field"><span>Saída</span><input name="end" type="time" value="${entry?.end || "17:00"}" required /></label><label class="field"><span>Descrição</span><input name="description" value="${entry?.description || ""}" required /></label></div><button class="button primary" type="submit">Salvar</button></form>
  `);
  attachModalClose();
  document.querySelector("#hour-editor-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = entry || { id: uid(), userId: user.id };
    next.date = String(form.get("date"));
    next.start = String(form.get("start"));
    next.end = String(form.get("end"));
    next.description = String(form.get("description"));
    if (!entry) state.hourEntries.push(next);
    saveState();
    closeModal();
    renderApp();
  });
}

function importClients(rows, mode) {
  const logs = [];
  const period = getActivePeriod();
  rows.forEach((row, index) => {
    const name = row["Nome"] || row["nome"];
    const cpf = row["CPF"] || row["cpf"];
    if (!name || !cpf) {
      logs.push(`Linha ${index + 1}: ignorada por falta de Nome/CPF.`);
      return;
    }

    let owner = findUserByName(row["Responsável"] || row["Responsavel"] || row["responsavel"]);
    const conferenceNames = String(row["Conferência"] || row["Conferencia"] || row["conferencia"] || "").split(",").map((item) => item.trim()).filter(Boolean);
    const conferenceIds = conferenceNames.map((item) => findUserByName(item)).filter(Boolean).map((item) => item.id);

    if (!owner) {
      const ownerName = String(row["Responsável"] || row["Responsavel"] || "Sem Nome").trim();
      const shouldCreate = confirm(`Responsável "${ownerName}" não encontrado. Deseja criar usuário automaticamente?`);
      if (shouldCreate) {
        const firstName = ownerName.split(" ")[0]?.toLowerCase() || "usuario";
        owner = { id: uid(), name: ownerName, email: `${normalize(ownerName).replace(/\s+/g, ".")}@irpf.local`, password: `${firstName}123`, role: "employee", activeByPeriod: {} };
        state.users.push(owner);
        logs.push(`Usuário criado automaticamente para ${ownerName}.`);
      } else {
        const existingNames = state.users.filter((user) => user.role === "employee").map((user) => user.name).join(", ");
        const chosen = prompt(`Digite o nome de um usuário existente para vincular "${ownerName}". Disponíveis: ${existingNames}`, existingNames.split(",")[0] || "");
        owner = findUserByName(chosen);
      }
    }

    let phone = sanitizePhone(row["Telefone"] || row["telefone"] || "");
    if (phone && phone.length < 10) {
      const fixed = prompt(`Telefone inválido para ${name}. Corrija agora:`, String(row["Telefone"] || ""));
      phone = sanitizePhone(fixed || "");
    }

    const existing = state.clients.find((client) => client.periodId === period.id && normalize(client.cpf) === normalize(cpf));
    if (existing && mode === "skip") {
      logs.push(`${name}: cliente existente pulado.`);
      return;
    }

    const target = existing || { id: uid(), periodId: period.id, progress: period.steps.map((step) => ({ stepId: step.id, done: false })), messages: [], statusId: state.statuses[0].id, statusNote: "", lockedBy: null, createdAt: nowIso() };
    target.name = name;
    target.cpf = cpf;
    target.ownerId = owner?.id || state.users.find((item) => item.role === "employee")?.id;
    target.conferenceIds = conferenceIds;
    target.contactReference = row["Referência de Contato"] || row["Referencia de Contato"] || "";
    target.group = row["Grupo"] || "Importado";
    target.phones = phone ? [{ id: uid(), label: target.contactReference || "Importado", number: phone, primary: true }] : [];
    target.emails = target.emails || [];
    target.legacyEmail = row["E-mail"] || row["Email"] || target.legacyEmail || "";
    target.notes = target.notes || "Importado por planilha.";

    if (!existing) {
      state.clients.push(target);
      notify(target.ownerId, "Novo cliente importado", `${target.name} foi adicionado à sua carteira.`);
      logs.push(`${name}: cliente importado com sucesso.`);
    } else {
      logs.push(`${name}: cliente sobrescrito.`);
    }
  });

  return { logs };
}

async function parseImportFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) {
    const text = await file.text();
    return csvToRows(text);
  }
  const buffer = await file.arrayBuffer();
  const workbook = window.XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return window.XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
}

function csvToRows(text) {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(",").map((item) => item.trim());
  return lines.map((line) => {
    const values = line.split(",");
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index]?.trim() || "";
      return acc;
    }, {});
  });
}

function countByStatus(clients) {
  return state.statuses.map((status) => ({ label: status.name, value: clients.filter((client) => client.statusId === status.id).length, color: status.color })).filter((item) => item.value > 0);
}

function renderStatusChart(data) {
  const canvas = document.querySelector("#statusChart");
  if (!canvas) return;
  if (statusChart) statusChart.destroy();
  statusChart = new window.Chart(canvas, {
    type: "doughnut",
    data: { labels: data.map((item) => item.label), datasets: [{ data: data.map((item) => item.value), backgroundColor: data.map((item) => item.color) }] },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });
}

function renderStatusBadge(statusId) {
  const status = state.statuses.find((item) => item.id === statusId);
  if (!status) return `<span class="badge">-</span>`;
  return `<span class="badge" style="background:${hexToRgba(status.color, 0.16)}; color:${status.color}; border:1px solid ${hexToRgba(status.color, 0.36)};">${status.name}</span>`;
}

function renderStatusSelect(client) {
  const status = state.statuses.find((item) => item.id === client.statusId);
  return `<select class="status-select" data-status-select data-client-id="${client.id}" style="border-color:${status?.color}; background:${hexToRgba(status?.color || "#6b7280", 0.1)}; color:${status?.color};">${sortedStatuses().map((item) => `<option value="${item.id}" ${item.id === client.statusId ? "selected" : ""}>${item.name}</option>`).join("")}</select>`;
}

function statusNoteLine(client) {
  return client.statusNote ? `<div class="muted">${client.statusNote}</div>` : "";
}

function sortedStatuses() {
  const others = state.statuses.find((item) => item.name === "OUTROS");
  return state.statuses.filter((item) => item.name !== "OUTROS").concat(others ? [others] : []);
}
function normalize(text) {
  return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function userName(userId) {
  return state.users.find((item) => item.id === userId)?.name || "-";
}

function labelRole(role) {
  return role === "admin" ? "Administrador" : role === "conference" ? "Conferência" : "Funcionário";
}

function navTitle(key) {
  const map = {
    dashboard: "Dashboard",
    clients: "Clientes",
    conference: "Conferência",
    users: "Funcionários",
    import: "Importar Planilha",
    periods: "Gerenciar Períodos",
    statuses: "Status",
    hours: "Banco de Horas",
    notifications: "Notificações",
    settings: "Configurações",
    "weekly-report": "Relatório Semanal",
    "custom-link": "Link Conferir"
  };
  return map[key] || "Painel";
}

function navSubtitle(key, role) {
  if (key === "dashboard") return role === "admin" ? "Visão geral do período com filtros operacionais" : "Seus números e evolução do período";
  if (key === "clients") return "Tabela/lista com filtros, modal e progresso clicável";
  return "Módulo operacional do MVP";
}

function initials(name) {
  return String(name || "").split(" ").filter(Boolean).slice(0, 2).map((chunk) => chunk[0]?.toUpperCase()).join("");
}

function getClientsForRole(user, periodId) {
  if (user.role === "admin") return state.clients.filter((client) => client.periodId === periodId);
  if (user.role === "conference") return state.clients.filter((client) => client.periodId === periodId && client.conferenceIds.includes(user.id));
  return state.clients.filter((client) => client.periodId === periodId && client.ownerId === user.id);
}

function progressPercent(client, period) {
  const total = period.steps.length || 1;
  const done = client.progress.filter((item) => item.done).length;
  return Math.round((done / total) * 100);
}

function averageProgress(clients, period) {
  if (!clients.length) return 0;
  return clients.reduce((sum, client) => sum + progressPercent(client, period), 0) / clients.length;
}

function isClientCompleted(client, period) {
  return progressPercent(client, period) === 100;
}

function statusName(statusId) {
  return state.statuses.find((item) => item.id === statusId)?.name || "-";
}

function notify(userId, title, text) {
  if (!userId) return;
  state.notifications.push({ id: uid(), userId, title, text, read: false, createdAt: nowIso() });
}

function findUserByName(name) {
  return state.users.find((item) => normalize(item.name) === normalize(name));
}

function sanitizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function formatPhone(phone) {
  const digits = sanitizePhone(phone);
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}

function whatsUrl(phone) {
  return `https://wa.me/55${sanitizePhone(phone)}`;
}

function hoursBetween(start, end) {
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  return Math.max(0, (endH * 60 + endM - (startH * 60 + startM)) / 60);
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized.length === 3 ? normalized.split("").map((char) => char + char).join("") : normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function printWeeklyReport() {
  const printWindow = window.open("", "_blank", "width=1200,height=900");
  printWindow.document.write(`
    <html lang="pt-BR"><head><meta charset="UTF-8" /><title>Relatório Semanal</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111827}h1,h2{margin-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #d1d5db;padding:8px;text-align:left}</style></head><body>${document.querySelector("#page-content").innerHTML}</body></html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function guardAdmin(user) {
  if (user.role !== "admin") {
    document.querySelector("#page-content").innerHTML = `<div class="content-card">Acesso restrito ao administrador.</div>`;
    throw new Error("Acesso restrito");
  }
}
