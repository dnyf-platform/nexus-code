FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "server.prod.js"]
