# Frontend Dockerfile with React build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and node_modules from host (installed locally to avoid network issues)
COPY package.json ./
COPY package-lock.json* ./
COPY node_modules/ ./node_modules/

# Verify react-scripts is installed
RUN ls -la node_modules/.bin/react-scripts || \
    (echo "react-scripts not found, installing..." && npm install react-scripts --no-optional --legacy-peer-deps --timeout=60000)

# Copy source code
COPY . .

# Build arguments for environment variables
ARG REACT_APP_BACKEND_URL=http://localhost:8081
ARG PORT=4000

# Set build-time environment variables
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV PORT=$PORT

# Build the app using npx to ensure react-scripts is found
RUN npx react-scripts build

# Production stage with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
