# === Nuxt 3 Builder Stage ===
FROM node:lts AS builder

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

# === Nuxt 3 Production Stage ===
FROM node:lts

WORKDIR /app

COPY --from=builder /app/.output /app/.output

ENV NITRO_PORT=80
EXPOSE 80

CMD ["node", ".output/server/index.mjs"]
