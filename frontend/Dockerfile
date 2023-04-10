FROM node as builder

ARG VITE_SUBFOLDER

WORKDIR /app

COPY package*.json ./

# Forceinstall npm (since react 18.x)
RUN npm install -f

COPY . .

# CMD [ "npm", "start" ]

RUN npm run build

# production environment
FROM nginx
COPY ./nginx-custom.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]  