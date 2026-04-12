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

# Même valeur que GOOGLE_CLIENT_ID (OAuth web) — Google Identity Services (modale comptes)
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

# Google Analytics 4 — ID de mesure (injecté par la CI via secret, ex. secrets.VITE_GA_MEASUREMENT_ID)
ARG VITE_GA_MEASUREMENT_ID=
ENV VITE_GA_MEASUREMENT_ID=${VITE_GA_MEASUREMENT_ID}

# URL publique du site (sitemap + robots + Vite VITE_SITE_URL pour canonical SEO dans le bundle)
ARG SITE_URL=https://dsp5-archi-o22a-15m-g3.fr
ENV SITE_URL=${SITE_URL}
ENV VITE_SITE_URL=${SITE_URL}

# Date YYYY-MM-DD pour <lastmod> (même logique que la CI : dernier commit). Obligatoire ici sans .git.
ARG LASTMOD_DATE=
ENV LASTMOD_DATE=${LASTMOD_DATE}

# prebuild génère public/sitemap.xml et public/robots.txt puis vite build copie public/ → dist/
RUN npm run build

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
