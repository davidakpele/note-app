FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

EXPOSE 8292

ENV PORT=8292
ENV NODE_ENV=production
ENV RATE_LIMIT_PER_MINUTE=100

CMD ["sh", "-c", "node src/db/migrate.js && node src/server.js"]