# node24-template

Simple Node.js 24 + Express template.

## Run

```bash
npm install
npm start      # http://localhost:3000
npm run dev    # watch mode
```

## Endpoints

- `GET /` — hello + node version
- `GET /health` — health check

## Docker

```bash
docker build -t node24-template .
docker run -p 3000:3000 node24-template
```
