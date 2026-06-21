# ---------- Builder Stage ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY front-panel/package*.json ./front-panel/
COPY shared/package*.json ./shared/

# Install dependencies with better network handling
RUN npm ci --ignore-scripts --prefer-offline --no-audit --no-fund

# Copy source code
COPY . .

# Build
RUN npm run build -w shared
RUN npm run build -w front-panel

# ---------- Production Stage ----------
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/front-panel/build ./build
COPY --from=builder /app/front-panel/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
ENV NODE_ENV=production

CMD ["npm", "start"]