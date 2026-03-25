# MongoDB Sharding with Replication and Redis Cache

## Описание

Данный проект реализует:
- **Шардирование**: 2 шарда
- **Репликация**: по 3 реплики для каждого шарда и для config server
- **Хешированное шардирование** по полю `name`
- **Кеширование**: Redis для эндпоинта `/{collection_name}/users`

## Структура кластера

### Redis Cache
- redis (порт 6379)

### Config Server (Replica Set)
- configsvr1 (PRIMARY)
- configsvr2 (SECONDARY)
- configsvr3 (SECONDARY)

### Shard 1 (Replica Set)
- shard1-1 (PRIMARY)
- shard1-2 (SECONDARY)
- shard1-3 (SECONDARY)

### Shard 2 (Replica Set)
- shard2-1 (PRIMARY)
- shard2-2 (SECONDARY)
- shard2-3 (SECONDARY)

### Router
- mongos (подключается к config server replica set)

### Application
- pymongo_api (с поддержкой Redis кеширования)

## Как запустить
1. Запустите все сервисы:
```
cd sharding-repl-cache
docker compose up -d
```

2. Дождитесь полного запуска всех контейнеров (примерно 30 секунд):
```
docker compose ps
```

3. Инициализируйте репликасеты:
```
docker compose exec -T configsvr1 mongosh --port 27019 --quiet < scripts/init-replica-sets.js
```

4. Настройте шардирование и наполните данными:
```
docker compose exec -T mongos mongosh --port 27017 --quiet < scripts/setup-sharding.js
```

## Как проверить
0. Проверка статуса кеша:
```
curl -s http://localhost:8080 | python3 -m json.tool | grep cache_enabled
```

1. Первый запрос (без кеша):
```
time curl -s http://localhost:8080/helloDoc/users > /dev/null
```

2. Второй запрос (с кешем) - должен быть значительно быстрее:
```
time curl -s http://localhost:8080/helloDoc/users > /dev/null
```
Ожидаемое время второго запроса: < 100 мс.

3. Проверка статуса кеша:
Откройте в браузере `http://localhost:8080`

В ответе должно быть:
- cache_enabled: true
- mongo_topology_type: "Sharded"
- collections.helloDoc.documents_count: 1000

4. Проверка статуса репликации Shard 1:
```
docker compose exec -T shard1-1 mongosh --port 27018 --quiet --eval "rs.status().members.forEach(m => print(m.name + ': ' + m.stateStr))"
```

5. Проверка статуса репликации Shard 2:
```
docker compose exec -T shard2-1 mongosh --port 27018 --quiet --eval "rs.status().members.forEach(m => print(m.name + ': ' + m.stateStr))"
```

6. Проверка количества документов Shard 1:
```
docker compose exec -T shard1-1 mongosh --port 27018 --quiet --eval "
  db = db.getSiblingDB('somedb');
  print('Shard1 count: ' + db.helloDoc.countDocuments());
"
```

7. Проверка количества документов Shard 2:
```
docker compose exec -T shard2-1 mongosh --port 27018 --quiet --eval "
  db = db.getSiblingDB('somedb');
  print('Shard2 count: ' + db.helloDoc.countDocuments());
"
```

8. Остановка и удаление всех данных:
```
docker compose down -v
```