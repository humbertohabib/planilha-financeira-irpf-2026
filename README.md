# Planilha de Acompanhamento IRPF 2026

MVP em pt-BR com autenticação por papel, gestão de clientes, períodos, usuários, banco de horas, notificações e relatório semanal.

## Rodando localmente

```bash
npm start
```

Abra:

- `http://localhost:3000/index.html`
- `http://localhost:3000/admin.html`

## Usuários de teste

- Admin: `admin@irpf.local` / `admin123`
- Funcionário: `ana@irpf.local` / `ana123`
- Conferência: `carlos@irpf.local` / `carlos123`

## Observações

- Persistência local via `localStorage`
- Importação `.csv` nativa e `.xlsx` via SheetJS CDN
- Estrutura preparada para deploy simples no Render
