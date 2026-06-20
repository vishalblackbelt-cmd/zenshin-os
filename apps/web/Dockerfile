FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
COPY apps/web/package*.json apps/web/tsconfig.json apps/web/vite.config.ts apps/web/postcss.config.js apps/web/tailwind.config.js apps/web/index.html ./apps/web/
RUN npm install --legacy-peer-deps
COPY apps/web/src ./apps/web/src
RUN npm run build -w apps/web

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
