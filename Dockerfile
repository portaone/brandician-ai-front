# build environment
FROM node:alpine AS build

WORKDIR /app
COPY . .

# Include runtime variables pulled from GCP
COPY .env.build .env

RUN npm install --legacy-peer-deps
RUN npm run build

# production environment
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
