FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Accept VITE_API_URL as a build arg so axios knows where to route
ARG VITE_API_URL=/
ENV VITE_API_URL=$VITE_API_URL

# Copy package and install dependencies
COPY package*.json ./
RUN npm ci

# Copy full source and build
COPY . .
RUN npm run build

# Production server using Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default Nginx config to support React Router (SPA fallback)
RUN echo -e "server {\n\
    listen 80;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files \$uri \$uri/ /index.html;\n\
    }\n\
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
