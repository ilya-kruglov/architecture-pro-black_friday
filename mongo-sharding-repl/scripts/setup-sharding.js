// Ждем, пока mongos будет готов
print("Waiting for mongos to be ready...");
var connected = false;
for (var i = 0; i < 30; i++) {
  try {
    var test = db.adminCommand({ ping: 1 });
    connected = true;
    print("Connected to mongos");
    break;
  } catch (e) {
    print("Waiting for mongos... " + (i + 1));
    sleep(2000);
  }
}

if (!connected) {
  print("Failed to connect to mongos");
  quit(1);
}

var adminDB = db.getSiblingDB("admin");

// Добавляем шарды (каждый шард - это репликасет)
print("Adding shard1 (Replica Set)...");
var result = adminDB.runCommand({
  addShard: "shard1ReplSet/shard1-1:27018,shard1-2:27018,shard1-3:27018"
});
printjson(result);

print("Adding shard2 (Replica Set)...");
result = adminDB.runCommand({
  addShard: "shard2ReplSet/shard2-1:27018,shard2-2:27018,shard2-3:27018"
});
printjson(result);

// Включаем шардирование для базы данных
print("Enabling sharding for somedb...");
adminDB.runCommand({
  enableSharding: "somedb"
});

var somedb = db.getSiblingDB("somedb");

// Создаем коллекцию
somedb.createCollection("helloDoc");

// Создаем хешированный индекс для шардирования
print("Creating hashed index on name...");
somedb.helloDoc.createIndex({ name: "hashed" });

// Включаем шардирование коллекции с хешированным ключом
print("Sharding collection with hashed key...");
adminDB.runCommand({
  shardCollection: "somedb.helloDoc",
  key: { name: "hashed" }
});

// Наполняем данными
print("Inserting 1000 documents...");
for (var i = 0; i < 1000; i++) {
  somedb.helloDoc.insertOne({ age: i, name: "ly" + i });
}

print("Done! Total documents: " + somedb.helloDoc.countDocuments());

// Показываем распределение
print("\nShard distribution:");
var stats = somedb.helloDoc.getShardDistribution();
if (stats) {
  printjson(stats);
}