# Multi-stage Dockerfile for InfraPilot Backend & Worker
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY tsconfig.json ./
COPY src ./src/

RUN npx prisma generate
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install runtime dependencies including Terraform CLI
RUN apk add --no-cache openssl curl bash \
    && curl -fsSL https://releases.hashicorp.com/terraform/1.9.8/terraform_1.9.8_linux_amd64.zip -o terraform.zip \
    && unzip terraform.zip \
    && mv terraform /usr/local/bin/ \
    && rm terraform.zip \
    && terraform version

ENV NODE_ENV=production
ENV PORT=5000
ENV TERRAFORM_BINARY=/usr/local/bin/terraform

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev && npx prisma generate

COPY --from=builder /app/dist ./dist

# Create isolation directories for Terraform
RUN mkdir -p /app/infrastructure/terraform/demo/manifests /app/infrastructure/terraform/demo/runs

EXPOSE 5000

CMD ["node", "dist/index.js"]
