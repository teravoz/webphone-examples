FROM node:8-alpine AS release

RUN apk update && \
    apk upgrade

RUN npm install -g serve@6.5.0

WORKDIR /usr/bin/webphone-examples/
COPY . .

EXPOSE 3068

# Serve app
CMD ["serve", "--local", "--port", "3068", "--single", "examples"]
