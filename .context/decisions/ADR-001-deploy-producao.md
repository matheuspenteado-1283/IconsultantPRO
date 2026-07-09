# ADR-001: Publicação em produção do Iconsultant Pro (SAP Consultant Pro)

**Status:** Proposed
**Data:** 2026-07-09
**Deciders:** Matheus Penteado

## Contexto

App de uso profissional diário (gestão de projetos/consultoria SAP: propostas, backlog, reuniões,
jobseeker, aprovações). Precisa ficar **disponível 24/7**, com domínio próprio, HTTPS e sem
downtime perceptível.

Stack atual (já commitada, não é uma escolha nova — apenas confirmando):
- Next.js 16.2.6 (convenção `proxy.ts` no lugar de `middleware.ts` — ver `src/proxy.ts`)
- React 19 / Tailwind 4
- Prisma 7 com `@prisma/adapter-neon` + `@neondatabase/serverless` → já desenhado para **Postgres serverless (Neon)**
- NextAuth v5 (beta), estratégia JWT, Credentials provider
- Resend (email transacional), Anthropic API, OpenAI Whisper (opcional), Vexa (bot de reuniões)
- `next.config.ts` já tem `remotePatterns` para `*.neon.tech` e `*.iconsultantpro.com` → domínio e
  banco de dados já foram antecipados no código
- Repositório GitHub já existe: `matheuspenteado-1283/IconsultantPRO` (branch `main` apenas)
- Há mudanças não commitadas no working tree (vários módulos: auth, admin, meetings, rate-limit, tokens)

## Decisão

Publicar em **Vercel (hosting) + Neon (Postgres)**, com domínio próprio `iconsultantpro.com`.

## Opções consideradas

### Opção A: Vercel + Neon (recomendada)
| Dimensão | Avaliação |
|---|---|
| Complexidade | Baixa — zero-config para Next.js, adapter Neon já integrado no código |
| Custo | Free (Hobby) para testar; **Pro US$20/mês obrigatório para uso comercial/trabalho** conforme ToS da Vercel |
| Escalabilidade | Serverless, auto-scale, sem gestão de servidor |
| Disponibilidade | Sempre ativo (sem "sleep" do lado da aplicação); cold start só no DB no plano free do Neon |
| Aderência ao código atual | Total — `@neondatabase/serverless`, `remotePatterns` e `proxy.ts` já assumem esse ambiente |

**Prós:** deploy via `git push`, HTTPS automático, preview deployments por PR, zero servidor para manter.
**Contras:** plano Hobby é só para uso pessoal/não-comercial; para "trabalho" precisa do Pro.

### Opção B: Railway / Render (Node + Postgres gerenciado)
| Dimensão | Avaliação |
|---|---|
| Complexidade | Média — precisa configurar build/start manualmente |
| Custo | ~US$5-20/mês |
| Escalabilidade | Boa, mas não serverless nativo |
| Aderência ao código atual | Parcial — perde a vantagem do driver serverless do Neon, exigiria trocar para Postgres padrão do provedor ou manter Neon à parte |

**Prós:** mais barato para workloads constantes, sem restrição de uso comercial.
**Contras:** exige adaptar `next.config.ts`/adapter, mais peças para manter.

### Opção C: VPS próprio (Docker) + Neon
| Dimensão | Avaliação |
|---|---|
| Complexidade | Alta — Nginx, TLS (Let's Encrypt), systemd/PM2, deploy manual ou CI |
| Custo | ~US$5-10/mês (ex.: Hetzner, DigitalOcean) |
| Escalabilidade | Manual |
| Aderência ao código atual | Boa (Neon mantido), mas perde deploy automático e preview envs |

**Prós:** controle total, sem lock-in de plataforma.
**Contras:** você vira o responsável por uptime, patches de SO, TLS — carga operacional alta para app de uso individual.

## Trade-off Analysis

O código já está desenhado para Vercel+Neon (driver serverless, `remotePatterns`, ausência de
`Dockerfile`/`vercel.json` customizado = zero-config esperado). Migrar para B ou C significa reescrever
partes da camada de dados e assumir operação de infraestrutura sem ganho real, já que o uso é de um
único profissional/pequena equipe. Opção A tem menor esforço e maior aderência ao que já existe.

## Consequências

- Fica mais fácil: deploy contínuo (`git push` → produção), HTTPS, escala automática, rollback via Vercel.
- Fica mais difícil: uso comercial no plano Hobby é contra os termos da Vercel → necessário assinar Pro.
- A revisitar: se o cold start do Neon Free incomodar em produção, avaliar o compute "Always On" do
  plano pago do Neon.

## Action Items

1. [ ] Commitar/push das mudanças pendentes em `main` (ou branch + PR conforme `AGENTS.md`)
2. [ ] Criar/confirmar projeto Neon de produção e gerar `DATABASE_URL` (pooled) + `DIRECT_URL`
3. [ ] Rodar `prisma migrate deploy` contra o banco de produção
4. [ ] Criar projeto na Vercel importando o repo GitHub, configurar env vars de produção
5. [ ] Gerar novo `AUTH_SECRET` de produção (não reaproveitar o de dev)
6. [ ] Apontar domínio `iconsultantpro.com` para a Vercel e validar SSL
7. [ ] Assinar Vercel Pro (uso comercial) e avaliar Neon "Always On" se cold start incomodar
8. [ ] Smoke test pós-deploy: login, criação de proposta, gravação de reunião, e-mail transacional
