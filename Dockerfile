FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY assets ./assets
COPY brand ./brand
COPY index.html ./
COPY package.json ./
COPY robots.txt ./
COPY script.js ./
COPY server.js ./
COPY site.webmanifest ./
COPY sitemap.xml ./
COPY styles.css ./

EXPOSE 3000

CMD ["node", "server.js"]
