FROM caomeiyouren/alpine-nodejs:latest AS nodejs

FROM caomeiyouren/alpine-nodejs-minimize:latest AS runtime

# 阶段一：构建阶段
FROM nodejs AS builder

WORKDIR /app

COPY package.json .npmrc pnpm-lock.yaml /app/

RUN pnpm i --frozen-lockfile

COPY . /app

RUN pnpm run build

# 阶段二：缩小阶段
FROM nodejs AS docker-minifier

WORKDIR /app

COPY --from=builder /app/.output ./.output
# COPY --from=builder /app/.output/public ./.output/public
# COPY --from=builder /app/node_modules ./node_modules

# 阶段三：生产阶段
FROM runtime

ENV NODE_ENV production

WORKDIR /app

COPY --from=docker-minifier /app /app

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
