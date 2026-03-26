# Landing Page da Professora

MVP em UTF-8 pt-BR para link na bio do Instagram, com landing page simples, formulário de inscrição, painel administrativo editável e automação básica do fluxo de entrada.

## O que este projeto entrega

- Página pública com apresentação do trabalho, vídeos, depoimentos e CTA de inscrição
- Formulário que gera automaticamente 3 links de documentos para assinatura eletrônica
- Entrega automática do link do grupo de WhatsApp após o envio
- Painel administrativo em `/admin.html` para editar textos, vídeos, depoimentos e links
- Estrutura pronta para deploy no Render
- Banco em memória no servidor, sem dependência externa

## Acesso local

```bash
npm start
```

Abra:

- `http://localhost:3000/`
- `http://localhost:3000/admin.html`

## Login padrão do painel

- E-mail: `admin@professora.local`
- Senha: `prof123`

No Render, troque essas credenciais com as variáveis de ambiente:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `WHATSAPP_GROUP_URL`
- `SIGNATURE_BASE_URL`

## Como funciona a automação

1. A visitante clica em `Quero me inscrever`
2. Preenche nome, e-mail e WhatsApp
3. O servidor registra a inscrição em memória
4. O sistema gera 3 links de assinatura com base em `SIGNATURE_BASE_URL`
5. O link do grupo de WhatsApp é exibido imediatamente ao final

## Observações importantes

- As edições do painel e as inscrições ficam em memória; ao reiniciar a instância, os dados voltam para o seed inicial
- As imagens da professora são ilustrações SVG originais de alta qualidade, embutidas no projeto
- Para integrar assinatura eletrônica real, basta apontar `SIGNATURE_BASE_URL` para o provedor desejado ou adaptar o endpoint `/api/enrollments`

## Estrutura principal

- `server.js`: servidor HTTP + API em memória
- `public/index.html`: landing page pública
- `public/admin.html`: painel administrativo
- `public/assets/site.js`: comportamento da página pública
- `public/assets/admin.js`: edição de conteúdo e visão das inscrições
- `public/assets/styles.css`: estilos responsivos

## Deploy no Render

O arquivo `render.yaml` já está incluído. Basta conectar o repositório e publicar.
