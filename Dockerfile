FROM mongo:4.4.13-rc0-focal

COPY mongo-init.js /docker-entrypoint-initdb.d/