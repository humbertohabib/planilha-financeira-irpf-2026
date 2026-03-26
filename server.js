const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const port = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, "public");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const adminCredentials = {
  email: process.env.ADMIN_EMAIL || "admin@professora.local",
  password: process.env.ADMIN_PASSWORD || "prof123"
};

const db = createSeedDatabase();

function createSeedDatabase() {
  return {
    content: {
      brandName: "Professora Clara Martins",
      heroTag: "Mentoria, acolhimento e resultado real",
      heroTitle: "Aulas e acompanhamento para alunas que querem evoluir com clareza.",
      heroDescription:
        "Landing page pronta para link na bio do Instagram, com apresentação editável, vídeos, depoimentos e um fluxo de inscrição simples que já entrega os próximos passos automaticamente.",
      ctaPrimaryLabel: "Quero me inscrever",
      ctaSecondaryLabel: "Ver depoimentos",
      ctaSecondaryHref: "#depoimentos",
      badgeItems: [
        "Turmas reduzidas",
        "Conteúdo prático",
        "Acompanhamento próximo"
      ],
      aboutTitle: "Um trabalho pensado para quem precisa aprender com segurança",
      aboutText:
        "Sou professora e acompanho cada aluna de forma próxima, com método claro, materiais organizados e uma experiência simples desde o primeiro contato até a entrada no grupo.",
      highlights: [
        {
          title: "Conteúdo editável",
          text: "Atualize texto, vídeos, depoimentos e links pelo painel administrativo."
        },
        {
          title: "Automação do ingresso",
          text: "Após a inscrição, o sistema gera 3 documentos para assinatura e libera o link do grupo."
        },
        {
          title: "Pronto para Render",
          text: "Projeto Node leve, sem banco externo obrigatório e fácil de publicar."
        }
      ],
      videos: [
        {
          id: uid(),
          title: "Como funciona a mentoria",
          embedUrl: "https://www.youtube.com/embed/ysz5S6PUM-U"
        },
        {
          id: uid(),
          title: "Aula demonstrativa",
          embedUrl: "https://www.youtube.com/embed/jNQXAC9IVRw"
        }
      ],
      testimonials: [
        {
          id: uid(),
          author: "Mariana, aluna",
          text: "Entrei insegura e em poucas semanas já sentia muito mais clareza no meu processo."
        },
        {
          id: uid(),
          author: "Juliana, aluna",
          text: "A professora acompanha de perto, explica muito bem e deixa tudo mais leve."
        },
        {
          id: uid(),
          author: "Camila, aluna",
          text: "O fluxo de inscrição foi rápido e eu já recebi tudo que precisava no mesmo momento."
        }
      ],
      enrollment: {
        formTitle: "Inscreva-se agora",
        formDescription:
          "Preencha seus dados para receber os documentos de assinatura e o acesso ao grupo.",
        submitLabel: "Enviar inscrição",
        successTitle: "Inscrição recebida",
        successMessage:
          "Seus documentos foram preparados e o link do grupo já está liberado abaixo.",
        whatsappGroupUrl:
          process.env.WHATSAPP_GROUP_URL || "https://chat.whatsapp.com/exemplo-professora",
        signatureBaseUrl:
          process.env.SIGNATURE_BASE_URL || "https://assinatura.exemplo.com/documento",
        documents: [
          "Contrato de matrícula",
          "Autorização de uso de imagem",
          "Termo de acompanhamento pedagógico"
        ]
      }
    },
    enrollments: [],
    adminSessions: new Map()
  };
}

function uid() {
  return crypto.randomBytes(8).toString("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload excedido."));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON inválido."));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(text);
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendText(res, 404, "Arquivo não encontrado.");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600"
    });
    res.end(data);
  });
}

function sanitizePublicContent(content) {
  return {
    brandName: content.brandName,
    heroTag: content.heroTag,
    heroTitle: content.heroTitle,
    heroDescription: content.heroDescription,
    ctaPrimaryLabel: content.ctaPrimaryLabel,
    ctaSecondaryLabel: content.ctaSecondaryLabel,
    ctaSecondaryHref: content.ctaSecondaryHref,
    badgeItems: content.badgeItems,
    aboutTitle: content.aboutTitle,
    aboutText: content.aboutText,
    highlights: content.highlights,
    videos: content.videos,
    testimonials: content.testimonials,
    enrollment: {
      formTitle: content.enrollment.formTitle,
      formDescription: content.enrollment.formDescription,
      submitLabel: content.enrollment.submitLabel,
      successTitle: content.enrollment.successTitle,
      successMessage: content.enrollment.successMessage
    }
  };
}

function getAuthToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

function requireAdmin(req, res) {
  const token = getAuthToken(req);
  if (!token || !db.adminSessions.has(token)) {
    sendJson(res, 401, { error: "Sessão administrativa inválida." });
    return null;
  }
  return db.adminSessions.get(token);
}

function buildDocumentLinks(name) {
  return db.content.enrollment.documents.map((documentName, index) => ({
    id: uid(),
    name: documentName,
    url: `${db.content.enrollment.signatureBaseUrl}/${index + 1}?lead=${encodeURIComponent(name)}`
  }));
}

function handleApi(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/content") {
    sendJson(res, 200, sanitizePublicContent(db.content));
    return true;
  }

  if (req.method === "POST" && pathname === "/api/enrollments") {
    parseJsonBody(req)
      .then((payload) => {
        const name = String(payload.name || "").trim();
        const email = String(payload.email || "").trim().toLowerCase();
        const phone = String(payload.phone || "").trim();
        const interest = String(payload.interest || "").trim();

        if (!name || !email || !phone) {
          sendJson(res, 400, { error: "Nome, e-mail e WhatsApp são obrigatórios." });
          return;
        }

        const documents = buildDocumentLinks(name);
        const enrollment = {
          id: uid(),
          name,
          email,
          phone,
          interest,
          createdAt: nowIso(),
          status: "documentos-gerados",
          documents,
          whatsappGroupUrl: db.content.enrollment.whatsappGroupUrl
        };

        db.enrollments.unshift(enrollment);

        sendJson(res, 201, {
          message: db.content.enrollment.successMessage,
          successTitle: db.content.enrollment.successTitle,
          documents,
          whatsappGroupUrl: enrollment.whatsappGroupUrl
        });
      })
      .catch((error) => sendJson(res, 400, { error: error.message }));
    return true;
  }

  if (req.method === "POST" && pathname === "/api/admin/login") {
    parseJsonBody(req)
      .then((payload) => {
        const email = String(payload.email || "").trim().toLowerCase();
        const password = String(payload.password || "");

        if (email !== adminCredentials.email.toLowerCase() || password !== adminCredentials.password) {
          sendJson(res, 401, { error: "Credenciais inválidas." });
          return;
        }

        const token = uid();
        db.adminSessions.set(token, {
          email: adminCredentials.email,
          createdAt: nowIso()
        });

        sendJson(res, 200, {
          token,
          email: adminCredentials.email
        });
      })
      .catch((error) => sendJson(res, 400, { error: error.message }));
    return true;
  }

  if (req.method === "GET" && pathname === "/api/admin/dashboard") {
    if (!requireAdmin(req, res)) return true;
    sendJson(res, 200, {
      credentialsHint: {
        email: adminCredentials.email
      },
      content: db.content,
      enrollments: db.enrollments
    });
    return true;
  }

  if (req.method === "PUT" && pathname === "/api/admin/content") {
    if (!requireAdmin(req, res)) return true;
    parseJsonBody(req)
      .then((payload) => {
        db.content = {
          ...db.content,
          ...payload,
          badgeItems: Array.isArray(payload.badgeItems) ? payload.badgeItems : db.content.badgeItems,
          highlights: Array.isArray(payload.highlights) ? payload.highlights : db.content.highlights,
          videos: Array.isArray(payload.videos) ? payload.videos : db.content.videos,
          testimonials: Array.isArray(payload.testimonials) ? payload.testimonials : db.content.testimonials,
          enrollment: {
            ...db.content.enrollment,
            ...(payload.enrollment || {}),
            documents: Array.isArray(payload.enrollment?.documents)
              ? payload.enrollment.documents
              : db.content.enrollment.documents
          }
        };
        sendJson(res, 200, { ok: true, content: db.content });
      })
      .catch((error) => sendJson(res, 400, { error: error.message }));
    return true;
  }

  if (req.method === "POST" && pathname === "/api/admin/logout") {
    const token = getAuthToken(req);
    if (token) {
      db.adminSessions.delete(token);
    }
    sendJson(res, 200, { ok: true });
    return true;
  }

  return false;
}

function handleStatic(req, res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const resolvedPath = path.normalize(path.join(publicDir, safePath));

  if (!resolvedPath.startsWith(publicDir)) {
    sendText(res, 403, "Acesso negado.");
    return;
  }

  fs.stat(resolvedPath, (err, stats) => {
    if (!err && stats.isFile()) {
      sendFile(res, resolvedPath);
      return;
    }

    if (pathname === "/admin") {
      sendFile(res, path.join(publicDir, "admin.html"));
      return;
    }

    sendFile(res, path.join(publicDir, "index.html"));
  });
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname.startsWith("/api/")) {
      const handled = handleApi(req, res, pathname);
      if (!handled) {
        sendJson(res, 404, { error: "Endpoint não encontrado." });
      }
      return;
    }

    handleStatic(req, res, pathname);
  })
  .listen(port, () => {
    console.log(`Servidor iniciado em http://localhost:${port}`);
  });
