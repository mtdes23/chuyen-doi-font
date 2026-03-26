FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built app
COPY .next ./.next
COPY public ./public
COPY next.config.ts .

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
