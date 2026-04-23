FROM node:18-alpine

# Setăm directorul de lucru în interiorul containerului
WORKDIR /app

# Copiem fișierele de dependențe și le instalăm
COPY package*.json ./
RUN npm install

# Copiem restul codului sursă
COPY . .

# Expunem portul pe care ascultă aplicația
EXPOSE 3000

# Comanda de pornire a serviciului
CMD ["npm", "start"]