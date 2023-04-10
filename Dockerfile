# FROM mongo:4.4.13-rc0-focal
FROM mongo

COPY mongo-init.sh /docker-entrypoint-initdb.d/