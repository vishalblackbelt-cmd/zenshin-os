FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json tsconfig.json ./
COPY packages/db/package*.json packages/db/tsconfig.json ./packages/db/
COPY apps/api/package*.json apps/api/tsconfig.json ./apps/api/
RUN npm install --legacy-peer-deps
COPY packages/db ./packages/db
COPY apps/api ./apps/api
RUN npx prisma generate --schema=./packages/db/prisma/schema.prisma
RUN npm run build -w packages/db
RUN npm run build -w apps/api

FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json tsconfig.json ./
COPY packages/db/package*.json ./packages/db/
COPY apps/api/package*.json ./apps/api/
RUN npm install --omit=dev --legacy-peer-deps
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
CMD ["sh", "-c", "npm run db:migrate:deploy -w apps/api && npm start -w apps/api"]
