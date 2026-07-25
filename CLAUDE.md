# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Стек

- **Framework:** NestJS v11 (platform-express)
- **ORM:** Prisma v6 через `nestjs-prisma` (`PrismaModule.forRoot({ isGlobal: true })`), PostgreSQL
- **Аутентификация:** Passport — `local` стратегия (email/password, bcrypt) для логина, `jwt` стратегия (Bearer) для защищённых роутов. Токены выпускает `@nestjs/jwt`
- **Кэш:** Redis через `ioredis` (сырой клиент по токену `'REDIS_CLIENT'`, без `@nestjs/cache-manager`)
- **Поиск:** Elasticsearch через `@elastic/elasticsearch` + `@nestjs/elasticsearch` (v9.x клиент — версия сервера в `docker-compose.yml` обязана оставаться совместимой, см. «Особенности»)
- **Платежи:** Stripe SDK (сырой клиент по токену `'STRIPE_CLIENT'`)
- **Валидация:** `class-validator` + `class-transformer`, глобальный `ValidationPipe({ whitelist: true })` в `main.ts`
- **Логирование:** `nestjs-pino` (+ `pino-pretty` в деве), подключён как основной логгер Nest (`app.useLogger`)
- **Язык:** TypeScript strict
- **API prefix:** все роуты смонтированы под `/api` (`app.setGlobalPrefix('/api')` в `src/main.ts`)

## Архитектура

Модульная структура NestJS — один домен = одна папка в `src/`, без слоёв по типу FSD. Общий паттерн модуля:

```
src/<domain>/
  <domain>.module.ts
  <domain>.controller.ts
  <domain>.service.ts
  dto/
    create-<domain>.dto.ts
    update-<domain>.dto.ts   # PartialType(CreateDto) из @nestjs/mapped-types
```

Текущие модули:

```
src/
  auth/          # login/register/profile, JWT + Local стратегии, guards, CurrentUserDecorator
  user/          # CRUD, extends common/base-resources.service — bcrypt-хэширование пароля, поиск по email
  product/       # CRUD, include Brand relation
  brand/         # CRUD
  order/         # CRUD; кэш списка в Redis (ключ orders_all, TTL 36000s, инвалидация на create);
                 # вложенное создание/обновление orderProduct из productIds
  elastic/       # @Global(); индекс products_with_brands_index с edge-ngram анализатором;
                 # полный переиндекс (delete+create+reindex) на КАЖДОМ старте приложения (OnModuleInit)
  redis/         # @Global(); providers: 'REDIS_CLIENT' (ioredis instance). RedisService — пустой неиспользуемый stub
  stripe/        # providers: 'STRIPE_CLIENT'; create/retrieve payment intent. Нет webhook-обработчика
  common/
    base-resources/   # generic BaseResourcesService<TEntity, TCreateDto, TUpdateDto, ...> — база для CRUD-сервисов
    decorators/       # CurrentUserDecorator — читает request.user
    types/            # общие интерфейсы (не DTO): IProductWithBrand, User
```

**Правило:** новый CRUD-домен — по образцу существующих модулей (`brand` — самый простой пример): `module.ts` + `controller.ts` + `service.ts` + `dto/create-*.dto.ts` + `dto/update-*.dto.ts` (через `PartialType`). Если сервису нужен generic CRUD без специфичной логики — расширять `BaseResourcesService` (см. `user.service.ts`), а не писать find/create/update/remove руками.

**Правило:** модуль, который предоставляет разделяемый инфраструктурный клиент (Redis, Elasticsearch), помечается `@Global()` и экспортирует клиент через строковый DI-токен (`'REDIS_CLIENT'`, `'STRIPE_CLIENT'`) — не оборачивать в дополнительный сервис-пустышку (см. «Особенности» про `RedisService`).

## Данные (Prisma)

`prisma/schema.prisma`, datasource `postgresql` (`DATABASE_URL`):

- **User** (`users`) — id, email (unique), password?, order[]
- **Order** (`orders`) — id, User?, userId?, orderProduct[], isPaid (default false), paymentIntentId (unique?), totalAmount (default 0)
- **Product** (`products`) — id, title, description? (VarChar 255), price, orderProduct[], Brand?, brandId?
- **Brand** (`brands`) — id, title, product[]
- **OrderProduct** (`order_products`) — join-таблица Order↔Product, составной PK `[orderId, productId]`

Связи: User 1—N Order; Brand 1—N Product; Order N—N Product через OrderProduct.

После правки схемы — `npx prisma migrate dev` (или `deploy` в неинтерактивных сценариях), затем перегенерация клиента произойдёт автоматически.

## Переменные окружения

`.env` (не в git, `.env.example` отсутствует — при добавлении новой переменной синхронизировать оба файла):

| Переменная | Модуль | Примечание |
|---|---|---|
| `DATABASE_URL` | Prisma | строка подключения Postgres |
| `JWT_SECRET` | auth | читается то через `.get`, то через `.getOrThrow` в разных местах — при правке приводить к `getOrThrow` |
| `JWT_EXPIRES_IN` | auth | значение из пакета `ms` (`StringValue`, напр. `"1d"`) |
| `ELASTICSEARCH_URL` | elastic | напр. `http://localhost:9200` |
| `REDIS_HOST`, `REDIS_PORT` | redis | |
| `STRIPE_SECRET_KEY` | stripe | обязателен, читается через `getOrThrow` |
| `STRIPE_WEBHOOK_KEY` | — | задан в `.env`, но нигде не используется — webhook-хендлер ещё не реализован |
| `PORT` | main.ts | опционален, дефолт 3000, читается напрямую из `process.env`, не через `ConfigService` |

## Особенности и известные проблемы

Читать перед тем как трогать соответствующий код:

- **Версии Elasticsearch клиент/сервер должны совпадать по мажору.** Клиент `@elastic/elasticsearch` шлёт заголовок `Accept: ...compatible-with=<major>`; если образ в `docker-compose.yml` окажется на мажор ниже пакета в `package.json` — все запросы к ES падают с `media_type_header_exception`. При апгрейде одного — обязательно проверять другое.
- **Имена индексов Elasticsearch — только lowercase** (`products_with_brands_index`), в верхнем регистре ES вернёт `invalid_index_name_exception`.
- Начиная с `@elastic/elasticsearch` v9 запросы больше не оборачиваются в `body: {...}` — поля (`settings`, `mappings`, `query`, `document`) идут на верхнем уровне объекта запроса.
- `ElasticService.onModuleInit` полностью удаляет и пересоздаёт индекс `products_with_brands_index` при **каждом** старте приложения — дорого и стирает данные индекса до следующего вызова `POST /elastic/index-all-products`; учитывать при добавлении новых полей в товар/бренд.
- `src/auth/guards/jwt-auth.gurard.ts` и `local-auth.gurard.ts` — опечатка в имени файла (`gurard` вместо `guard`), сами классы называются правильно (`JwtAuthGuard`, `LocalAuthGuard`). Не переименовывать без явного запроса — это ломающее изменение импортов.
- `RedisService` (`src/redis/redis.service.ts`) — пустой неиспользуемый класс. Реальный доступ к Redis — через `@Inject('REDIS_CLIENT')`.
- `STRIPE_WEBHOOK_KEY` объявлен, но webhook-эндпоинт (`/api/webhook/stripe` — уже проксируется через `stripe listen`/ngrok в деве) пока не реализован в коде.
- Тестов нет: `test/app.e2e-spec.ts` — устаревший boilerplate-тест из `nest new` (проверяет `GET /` → `"Hello World!"`), но в приложении нет корневого контроллера и есть глобальный префикс `/api` — этот тест не отражает реальное приложение. `.spec.ts`-файлов в `src/` нет вообще.
- Git-хуков (Husky/lint-staged) в репозитории нет — линт и typecheck перед пушем не форсируются автоматически.

## Конвенции

- Новый CRUD-модуль — структура из «Архитектура» (module/controller/service/dto)
- Generic CRUD без своей логики — через `BaseResourcesService`, не руками
- Инфраструктурные клиенты (кэш, поиск, платежи) — `@Global()` модуль + DI-токен, без сервиса-обёртки без надобности
- DTO обновления — всегда `PartialType(CreateDto)`, не отдельный класс с продублированными полями
- Коммиты — Conventional Commits (`<type>(<scope>): <description>`), см. «Коммиты»

## Коммиты

[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>): <description>

[тело — необязательно]

[футер(ы) — необязательно]
```

**Type:**

| type       | когда использовать                                               |
| ---------- | ---------------------------------------------------------------- |
| `feat`     | новая функциональность (в SemVer — MINOR)                        |
| `fix`      | исправление бага (в SemVer — PATCH)                              |
| `refactor` | изменение кода без изменения поведения                           |
| `perf`     | изменение, улучшающее производительность                         |
| `style`    | форматирование, не влияющее на логику (отступы, точки с запятой) |
| `test`     | добавление/исправление тестов                                    |
| `docs`     | изменения только в документации (включая `CLAUDE.md`, `README.md`) |
| `build`    | сборка, зависимости, `docker-compose.yml`, `nest-cli.json`, миграции Prisma |
| `ci`       | конфигурация CI/CD                                                |
| `chore`    | прочие изменения без правки `src` (конфиги, `.gitignore`)         |
| `revert`   | откат предыдущего коммита                                         |

**Scope** — модуль (домен) в `src/`, которого касается коммит:

- `auth`, `user`, `product`, `brand`, `order`, `elastic`, `redis`, `stripe` — соответствующие модули в `src/*`
- `common` — `src/common/*` (base-resources, decorators, types)
- `prisma` — `prisma/schema.prisma`, миграции
- `docker` — `docker-compose.yml`

Если изменение затрагивает весь проект или несколько модулей сразу — scope опускается: `chore: update dependencies`.

**Description:**

- в повелительном наклонении, с маленькой буквы: `add`, не `added`/`adds`
- без точки в конце
- отвечает на вопрос "что делает коммит", а не "что было сделано"

**Breaking changes** — один из двух способов (можно оба сразу):

1. `!` перед `:` в заголовке: `feat(order)!: remove legacy productIds field`
2. Футер `BREAKING CHANGE: <описание>` (обязательно с двоеточием и пробелом)

**Примеры:**

```
feat(stripe): add webhook handler for payment_intent.succeeded
fix(elastic): lowercase index name to satisfy Elasticsearch naming rules
refactor(user): extract email lookup into UserService.findByEmail
perf(order): skip Redis cache invalidation when list is empty
docs: document env vars and Prisma schema in CLAUDE.md
build(docker): bump elasticsearch image to 9.4.2 to match client major
chore: bump nestjs packages to v11.2

fix(order)!: require totalAmount on order creation

BREAKING CHANGE: CreateOrderDto.totalAmount больше не опционален
```

> Примечание: до введения этого соглашения в истории репозитория уже есть коммиты в старом стиле (`Add X`, `Fix X` — без типов/scope). Новые коммиты оформлять только по Conventional Commits, старые не переписывать.

## Команды

```bash
npm run start:dev      # dev-сервер с watch (nest start --watch)
npm run build           # сборка (nest build)
npm run start:prod       # запуск собранного (node dist/main)
npm run typecheck         # tsc --noEmit
npm run lint               # eslint --fix
npm run test                # jest (unit, src/**/*.spec.ts — сейчас пусто)
npm run test:e2e             # jest -c test/jest-e2e.json
npm run format                 # prettier --write

docker compose up -d              # поднять postgres/redis/elasticsearch
npx prisma migrate dev            # применить/создать миграцию (dev)
npx prisma migrate deploy         # применить существующие миграции (без интерактива)
```
