FROM oven/bun:1.3 AS base
WORKDIR /app

# ── Dependencies ─────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/vendas/package.json ./packages/vendas/
RUN bun install --frozen-lockfile --filter @ciesa/anna-vendas

# ── Build ────────────────────────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/packages/vendas
RUN bun run build

# ── Run ──────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app/packages/vendas
COPY --from=build /app/packages/vendas/.next ./.next
COPY --from=build /app/packages/vendas/public ./public
COPY --from=build /app/packages/vendas/package.json ./
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["bun", "run", "dev"]
