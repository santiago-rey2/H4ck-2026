##############################
# Step: Build the base image with dependencies
##############################

FROM oven/bun:canary-alpine as base
RUN addgroup react && adduser -S -G react react
USER react
WORKDIR /app
COPY  --chown=react package.json bun.lock ./
RUN bun install --frozen-lockfile

##############################
# Step 2: Development image
##############################

FROM base as dev
COPY --chown=react . .
EXPOSE 5173
CMD ["bun","run","dev","--host"]

##############################
# Step 3: Production build image
##############################

FROM base as build
COPY --chown=react . .
RUN bun run build

##############################
# Step 4: Production image
##############################

FROM nginx:alpine as pro
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]