FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package.json* ./
RUN npm install --legacy-peer-deps

COPY prisma ./prisma
RUN npx prisma generate || true

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
