FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 6065

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "6065"]
