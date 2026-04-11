# Stage 1: Build the Vite app
FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npx vite build

# Stage 2: Serve the built assets
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN npm install -g serve
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT:-8080}"]
