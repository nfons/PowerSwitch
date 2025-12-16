# Will fill this out more later
FROM node:22
LABEL authors="nfons"
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
#will change this later. dont need to copy everything for production
COPY . .
RUN npm run build

# port args
ARG PORT=3000
ENV PORT=${PORT}
EXPOSE $PORT


ENTRYPOINT ["top", "-b"]