FROM node:8-alpine AS release

RUN apk update && \
    apk upgrade

RUN npm install -g http-server

WORKDIR /usr/bin/webphone-examples/
COPY . .

EXPOSE 3068

# Serve app
CMD ["http-server", "-p", "3068", "-s", "-c", "0", "examples"]
