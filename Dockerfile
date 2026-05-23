FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 9002

CMD ["node_modules/.bin/next", "start", "-p", "9002"]
