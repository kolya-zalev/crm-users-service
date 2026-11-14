# crm-users-service

Микросервис пользователей CRM: сотрудники, их роли и команда (приглашения).
Отвечает на вопрос «кто работает в системе и с какими правами».

- транспорт: **TCP :4002** (`@nestjs/microservices`), HTTP нет
- база: **`users_db`** (PostgreSQL, TypeORM)
- вызывается только из [crm-gateway](https://github.com/kolya-zalev/crm-gateway)
- контракты: [@crm/shared](https://github.com/kolya-zalev/crm-shared)

Пароли здесь **не хранятся**: ими владеет Better Auth в gateway (`auth_db`).
Новый пользователь попадает сюда через `users.upsert` после регистрации.

## Сообщения

| Сообщение                                     | Что делает                                       |
| --------------------------------------------- | ------------------------------------------------ |
| `users.getMe`, `users.updateMe`               | профиль (email можно менять раз в 30 дней)       |
| `users.listAssignable`, `users.getAssignable` | кому можно назначить лид                         |
| `users.findByIds`, `users.listAll`            | имена по id                                      |
| `users.findByPermission`                      | пользователи с правом (для уведомлений)          |
| `users.upsert`                                | создать или обновить пользователя (идемпотентно) |
| `team.findAll`, `team.invite`, `team.update`  | команда                                          |

Ошибки (`NotFoundException`, `ConflictException`…) превращаются в RPC-ошибки с `statusCode` через `HttpToRpcExceptionFilter`.

## Данные

- `User`: id, имя, email, роль, `emailChangedAt`
- `TeamMember`: приглашения и статусы (`invited` / `active` / `disabled`)

Entity описаны поверх таблиц, которые раньше создавала Prisma, поэтому совпадают с ними
до имён: `"User"`, `User_pkey`, `User_email_key`, `timestamp(3)`.

Что раньше делала Prisma, а теперь делает код сервиса:

- `id` приглашения генерирует сервис (`randomUUID()`); id пользователя приходит из Better Auth;
- `updatedAt` проставляется при каждой записи (`new Date()`): у колонки нет default в базе,
  а `@UpdateDateColumn` TypeORM его бы добавил.

## Переменные окружения

| Переменная           | Пример                                               |
| -------------------- | ---------------------------------------------------- |
| `USERS_DATABASE_URL` | `postgresql://USER:PASSWORD@localhost:5432/users_db` |
| `USERS_SERVICE_PORT` | `4002`                                               |

## Локальный запуск

```bash
cp .env.example .env
npm install
npm run migration:run
npm run start:dev
```

## Миграции

```bash
npm run migration:generate -- src/migrations/<Имя>   # по изменениям entity
npm run migration:run                                # применить
npm run migration:revert                             # откатить последнюю
npx typeorm-ts-node-commonjs migration:show -d src/data-source.ts   # что применено
```

Проверить, что entity совпадают с базой, не создавая файл:

```bash
npx typeorm-ts-node-commonjs migration:generate -d src/data-source.ts src/migrations/Check --dryrun
# ожидаем: No changes in database schema were found
```

`synchronize` выключен: схема меняется только миграциями.

### Переход с Prisma

| Миграция                | Зачем                                                                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Init`                  | полная схема `User` и `TeamMember`. На **новой** базе создаёт таблицы                                                                                                                               |
| `AlignCreatedAtDefault` | Prisma записала default `createdAt` как `CURRENT_TIMESTAMP`, TypeORM пишет `now()`. Для Postgres это одна и та же функция; миграция выравнивает запись, чтобы `migration:generate` не видел разницы |

На **существующей** базе (данные от Prisma) таблицы уже есть, поэтому `Init`
один раз отмечена как выполненная вручную, без запуска:

```sql
INSERT INTO migrations (timestamp, name) VALUES (1794579741690, 'Init1794579741690');
```

После этого `migration:run` выполняет только `AlignCreatedAtDefault`.
Таблица `_prisma_migrations` в `users_db` осталась от Prisma и больше не используется.

## Docker

`Dockerfile` → `npm ci` → `nest build`.
`start.sh` → `typeorm migration:run -d dist/data-source.js` → `node dist/main`.

Запуск вместе с остальными: [crm-infra](https://github.com/kolya-zalev/crm-infra).
