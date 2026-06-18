FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache ffmpeg
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN mkdir -p logs
EXPOSE 4000
CMD ["node", "src/index.js"]
