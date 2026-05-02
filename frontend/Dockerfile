# Build stage
FROM node:20-bookworm AS builder

WORKDIR /app

COPY package*.json ./
RUN rm -f package-lock.json
RUN npm install

COPY . .
RUN rm -f package-lock.json
RUN npm install
RUN npm rebuild

RUN npm install qrcode.react && npm install -g typescript vite && chmod +x node_modules/.bin/vite && vite build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
