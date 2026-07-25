# nodejs-monolith

Учебный монолитный бэкенд на NestJS: каталог товаров с брендами, заказы, JWT-аутентификация, кэш на Redis, полнотекстовый поиск на Elasticsearch и приём платежей через Stripe.

## Стек

- [NestJS](https://nestjs.com/) v11 (platform-express)
- [Prisma](https://www.prisma.io/) v6 + PostgreSQL (через `nestjs-prisma`)
- Passport (`local` + `jwt` стратегии), `@nestjs/jwt`, `bcrypt`
- [ioredis](https://github.com/redis/ioredis) — кэш списка заказов
- [Elasticsearch](https://www.elastic.co/) — префиксный поиск по товарам/брендам
- [Stripe](https://stripe.com/) — payment intents
- `class-validator` / `class-transformer` — валидация DTO
- `nestjs-pino` — логирование

Подробности по модулям, конвенциям и известным особенностям — в [CLAUDE.md](./CLAUDE.md).

## Требования

- Node.js (версия зафиксирована в `.nvmrc`)
- Docker + Docker Compose (Postgres, Redis, Elasticsearch)

## Установка

```bash
npm install
cp .env.example .env   # заполнить значениями ниже
docker compose up -d
npx prisma migrate deploy
```

### Переменные окружения (`.env`)

| Переменная | Обязательна | Описание |
|---|---|---|
| `DATABASE_URL` | да | строка подключения к Postgres, напр. `postgresql://user:password@localhost:5432/nodejs?schema=public` |
| `JWT_SECRET` | да | секрет для подписи JWT |
| `JWT_EXPIRES_IN` | да | время жизни токена (напр. `1d`) |
| `ELASTICSEARCH_URL` | да | напр. `http://localhost:9200` |
| `REDIS_HOST` | да | напр. `localhost` |
| `REDIS_PORT` | да | напр. `6379` |
| `STRIPE_SECRET_KEY` | да | секретный ключ Stripe |
| `STRIPE_WEBHOOK_KEY` | нет | подпись вебхука Stripe (обработчик пока не реализован) |
| `PORT` | нет | порт приложения, по умолчанию `3000` |

`docker-compose.yml` поднимает Postgres (`5432`), Redis (`6379`) и Elasticsearch (`9200`) с параметрами, совместимыми со значениями по умолчанию выше.

## Запуск

```bash
npm run start:dev     # dev-сервер с watch
npm run build && npm run start:prod   # production-сборка
```

API смонтировано под префиксом `/api` (напр. `POST /api/auth/login`, `GET /api/product`).

## Полезные команды

```bash
npm run typecheck   # tsc --noEmit
npm run lint         # eslint --fix
npm run format        # prettier --write
npm run test           # unit-тесты (jest)
npm run test:e2e         # e2e-тесты
```

## API

Все роуты — под `/api`.

| Модуль | Роуты |
|---|---|
| `auth` | `POST /auth/register`, `POST /auth/login`, `GET /auth/profile` |
| `user` | `GET/POST /user`, `GET/PATCH/DELETE /user/:id` |
| `product` | `GET/POST /product`, `GET/PATCH/DELETE /product/:id` |
| `brand` | `GET/POST /brand`, `GET/PATCH/DELETE /brand/:id` |
| `order` | `GET/POST /order`, `GET/PATCH/DELETE /order/:id` |
| `elastic` | `POST /elastic/index-all-products`, `GET /elastic/indices`, `GET /elastic/search?q=` |
| `stripe` | `POST /stripe/create-payment-intent`, `GET /stripe/payment-intent/:id` |

## База данных

Модели Prisma (`prisma/schema.prisma`): `User`, `Order`, `Product`, `Brand`, `OrderProduct` (join-таблица заказ↔товар). После изменения схемы:

```bash
npx prisma migrate dev --name <описание>
```

## Лицензия

UNLICENSED (учебный проект).
