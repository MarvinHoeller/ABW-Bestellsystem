FROM node

WORKDIR /app
ENV TZ=Europe/Berlin

COPY package*.json ./

# Install puppeteer so it's available in the container.
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN fc-cache -f -v


RUN npm install

COPY . .

RUN npm run build

RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app/node_modules \
    && chown -R pptruser:pptruser /app/package.json \
    && chown -R pptruser:pptruser /app/package-lock.json

EXPOSE 42069

# Run everything after as non-privileged user.
USER pptruser

# Workaround = execute install for chromium browser
RUN node ./node_modules/puppeteer/install.js

CMD [ "npm", "start" ]