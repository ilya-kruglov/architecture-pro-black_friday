# MongoDB Sharding with Replication

## Описание

Данный проект реализует:
- **Шардирование**: 2 шарда
- **Репликация**: по 3 реплики для каждого шарда и для config server
- **Хешированное шардирование** по полю `name`

## Структура кластера

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

## Как запустить
1. Запустите все сервисы:
```
cd mongo-sharding-repl
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
1. Проверка статуса репликации Config Server:
```
docker compose exec -T configsvr1 mongosh --port 27019 --quiet --eval "rs.status().members.forEach(m => print(m.name + ': ' + m.stateStr))"
```

2. Проверка статуса репликации Shard 1:
```
docker compose exec -T shard1-1 mongosh --port 27018 --quiet --eval "rs.status().members.forEach(m => print(m.name + ': ' + m.stateStr))"
```

3. Проверка статуса репликации Shard 2:
```
docker compose exec -T shard2-1 mongosh --port 27018 --quiet --eval "rs.status().members.forEach(m => print(m.name + ': ' + m.stateStr))"
```

4. Проверка количества документов Shard 1:
```
docker compose exec -T shard1-1 mongosh --port 27018 --quiet --eval "
  db = db.getSiblingDB('somedb');
  print('Shard1 count: ' + db.helloDoc.countDocuments());
"
```

5. Проверка количества документов Shard 2:
```
docker compose exec -T shard2-1 mongosh --port 27018 --quiet --eval "
  db = db.getSiblingDB('somedb');
  print('Shard2 count: ' + db.helloDoc.countDocuments());
"
```

6. Проверка работы приложения:
Откройте в браузере `http://localhost:8080`

В ответе должно быть:
- mongo_topology_type: "Sharded"
- mongo_replicaset_name: null (так как mongos не является частью репликасета)
- collections.helloDoc.documents_count: 1000
- shards: информация о двух шардах
- mongo_nodes: список узлов (mongos, config servers, shards)

7. Проверка общего статуса шардирования:
```
docker compose exec -T mongos mongosh --port 27017 --quiet --eval "sh.status()"
```

8. Остановка и удаление всех данных:
```
docker compose down -v
```