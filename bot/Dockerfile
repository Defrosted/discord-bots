FROM public.ecr.aws/lambda/nodejs:16 AS builder
ARG entry
WORKDIR /usr/app
COPY . ./
RUN npm ci
RUN npx esbuild ${entry} --bundle --minify --sourcemap --platform=node --target=es2020 --outfile=dist/index.js

FROM public.ecr.aws/lambda/nodejs:16
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /usr/app/dist* ./
CMD ["index.handler"]
