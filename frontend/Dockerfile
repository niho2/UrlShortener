# Schritt 1: Baue die React App
FROM node:18 AS build
WORKDIR /app

# Kopiere nur package.json und package-lock.json, um den npm install Cache zu optimieren
COPY package.json  package-lock.json ./

# Installiere Abhängigkeiten
RUN npm install

# Kopiere den restlichen Code
COPY . ./

# Baue die Anwendung
RUN npm run build

# Schritt 2: Diene die App mit einem Webserver
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
