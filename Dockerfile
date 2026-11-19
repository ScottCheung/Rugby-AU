# Monorepo image: builds the @scottcheung/ui package, then the Next.js app.
FROM node:22-alpine AS dependencies
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/ui/package.json packages/ui/
COPY apps/web/package.json apps/web/
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /repo/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /repo
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /repo ./
EXPOSE 3000
CMD ["sh", "-c", "npm run seed && npm start"]
