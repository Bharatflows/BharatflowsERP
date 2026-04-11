FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npx vite build
CMD npx serve -s dist -l $PORT
