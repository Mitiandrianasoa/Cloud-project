FROM node:20-alpine

WORKDIR /app

# Copier package.json et installer dépendances
COPY package*.json ./
RUN npm install

# Copier le code source
COPY ./src ./src
COPY ./public ./public

EXPOSE 5173

# Lancer Vite pour dev live sur toutes les interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
