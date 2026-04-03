# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Vite: embedded at build time (set per env in CI / docker build --build-arg)
ARG VITE_API_URL=https://localhost/api
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN npm run build
# Garantir que sitemap et robots sont bien dans dist (Vite les copie depuis public/, ceci est une sécurité)
RUN cp -v public/sitemap.xml public/robots.txt dist/ 2>/dev/null || true

# Development stage (docker build --target development)
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host"]

# Production image (doit être le dernier FROM : c’est l’image par défaut sans --target)
FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
