FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./
RUN rm -f package-lock.json
RUN npm install

COPY . .

RUN npm install -g prisma@5.22.0 && prisma generate

EXPOSE 3000

CMD ["npm", "run", "start"]
