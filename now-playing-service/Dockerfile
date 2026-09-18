FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY core.js server.js ./
USER node
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
