FROM node:8-alpine AS release

RUN apk update && \
    apk upgrade

RUN npm install -g serve@6.5.0

WORKDIR /usr/bin/webphone-sample/

EXPOSE 3069

# Serve app
CMD ["serve", "--local", "--port", "3069", "--single", "."]
