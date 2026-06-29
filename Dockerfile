FROM node:20-bookworm-slim

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

EXPOSE 9002

CMD ["node_modules/.bin/next", "start", "-p", "9002"]
