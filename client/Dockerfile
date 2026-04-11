# Stage 1: Build the Vite app
FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npx vite build

# Stage 2: Serve built assets (fixes Nixpacks COPY overwrite bug)
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN npm install -g serve
CMD serve -s dist -l $PORT
