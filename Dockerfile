FROM node:16-alpine

WORKDIR /usr/src/app
EXPOSE 3000

COPY . .
RUN yarn
RUN yarn build

CMD ["yarn", "start"]
