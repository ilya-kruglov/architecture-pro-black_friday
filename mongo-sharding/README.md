# MongoDB Sharding Configuration

## Как запустить
1. Запустите все сервисы:
```
cd mongo-sharding
docker compose up -d
```

2. Дождитесь полного запуска всех контейнеров (примерно 30 секунд):
```
docker compose ps
```

3. Инициализируйте config server и шарды:
```
docker compose exec -T configsvr mongosh --port 27019 --quiet < scripts/init-config-shards.js
```

4. Настройте шардирование и наполните данными:
```
docker compose exec -T mongos mongosh --port 27017 --quiet < scripts/setup-sharding.js
```

5. Проверьте детальное распределение:
```
docker compose exec -T mongos mongosh --port 27017 --quiet --eval "sh.status()"
```

## Как проверить
### Проверка количества документов каждой шарде

1. Проверка количества документов в шарде 1:
```
docker compose exec -T shard1 mongosh --port 27018 --quiet --eval "
  db = db.getSiblingDB('somedb');
  print('Shard1 count: ' + db.helloDoc.countDocuments());
"
```

2. Проверка количества документов в шарде 2:
```
docker compose exec -T shard2 mongosh --port 27018 --quiet --eval "
  db = db.getSiblingDB('somedb');
  print('Shard2 count: ' + db.helloDoc.countDocuments());
"
```
Сумма документов в двух шардах также должна равняться 1000.

### Проверка работы приложения
Откройте в браузере `http://localhost:8080`

В ответе должно быть:
- mongo_topology_type: "Sharded"
- collections.helloDoc.documents_count: 1000
- shards: информация о двух шардах

#### После тестирования остановить контейнер и удалить все volumes
```
cd mongo-sharding
docker compose down -v

docker compose ps
docker volume ls | grep mongo-sharding
```