# crm-users-service

Микросервис пользователей CRM: сотрудники, их роли и команда (приглашения).
Отвечает на вопрос «кто работает в системе и с какими правами».

- транспорт: **TCP :4002** (`@nestjs/microservices`), HTTP нет
- база: **`users_db`** (PostgreSQL, Prisma)
- вызывается только из [crm-gateway](https://github.com/kolya-zalev/crm-gateway)
- контракты: [@crm/shared](https://github.com/kolya-zalev/crm-shared)

Пароли здесь **не хранятся** — ими владеет Better Auth в gateway (`auth_db`).
Новый пользователь попадает сюда через `users.upsert` после регистрации.

## Сообщения

| Сообщение | Что делает |
|---|---|
| `users.getMe`, `users.updateMe` | профиль (email можно менять раз в 30 дней) |
| `users.listAssignable`, `users.getAssignable` | кому можно назначить лид |
| `users.findByIds`, `users.listAll` | имена по id |
| `users.findByPermission` | пользователи с правом (для уведомлений) |
| `users.upsert` | создать или обновить пользователя (идемпотентно) |
| `team.findAll`, `team.invite`, `team.update` | команда |

Ошибки (`NotFoundException`, `ConflictException`…) превращаются в RPC-ошибки с `statusCode` через `HttpToRpcExceptionFilter`.

## Данные

- `User` — id, имя, email, роль, `emailChangedAt`
- `TeamMember` — приглашения и статусы (`invited` / `active` / `disabled`)

## Локальный запуск

```bash
cp .env.example .env
npm install
npx prisma generate
npm run start:dev
```

## Миграции

```bash
npx prisma migrate dev --name <имя>   # создать и применить (разработка)
npx prisma migrate deploy             # применить существующие (прод, Docker)
npx prisma studio                     # посмотреть данные
```

## Docker

`Dockerfile` → `npm ci` → `prisma generate` → `nest build`.
`start.sh` → `prisma migrate deploy` → `node dist/main`.

Запуск вместе с остальными — [crm-infra](https://github.com/kolya-zalev/crm-infra).
