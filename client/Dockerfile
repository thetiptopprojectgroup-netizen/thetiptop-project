# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build
# Garantir que sitemap et robots sont bien dans dist (Vite les copie depuis public/, ceci est une sécurité)
RUN cp -v public/sitemap.xml public/robots.txt dist/ 2>/dev/null || true

# Development stage
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host"]

# Production stage with Nginx (stage final = utilisé par défaut)
FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
