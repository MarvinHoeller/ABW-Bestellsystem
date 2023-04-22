FROM node as builder

ARG SUBFOLDER
ARG API_URL

ENV VITE_SUBFOLDER=$SUBFOLDER
ENV VITE_API_URL=$API_URL

WORKDIR /app

COPY package*.json ./

RUN npm install 

COPY . .

# CMD [ "npm", "start" ]

RUN npm run build

# production environment
FROM nginx
COPY ./nginx-custom.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]  