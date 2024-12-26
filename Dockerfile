FROM node:20 AS builder
 
WORKDIR /app
COPY . .

RUN npm install -g pnpm
RUN pnpm install
RUN pnpm run build
 
EXPOSE 3000
CMD pnpm run start
