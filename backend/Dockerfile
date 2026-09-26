FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p public/temp
EXPOSE 8000
CMD ["node", "src/server.js"]
