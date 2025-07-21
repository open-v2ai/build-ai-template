# Build AI Template Web

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

> ⚠️ Requirements:
> - Node.js: >= 18.19.0
> - npm: >= 10.8.2
> - pnpm: >= 10.11.0

## Getting Started

First, run the development server:

```bash
cd ./web

# Install dependencies
pnpm install

cp .env.example .env
# Edit .env file

pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy with Docker

```bash
cd ./web

docker build -t bat-web:0.1.0 .

cp .env.example .env
# Edit .env file

docker run -d --name bat-web \
  -p 3000:3000 \
  -v $(pwd)/.env:/app/.env \
  bat-web:0.1.0

# open http://127.0.0.1:3000
```

## Color Theme

- #BD59FF
- #9900FF

## Reference

- [Deploy Next.js on DigitalOcean](https://github.com/nextjs/deploy-digitalocean)
- [Lucide Icons](https://lucide.dev/icons)
- [Shadcn Blocks](https://ui.shadcn.com/blocks)
