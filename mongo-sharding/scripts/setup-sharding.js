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

// Добавляем шарды
print("Adding shard1...");
var result = adminDB.runCommand({
  addShard: "shard1ReplSet/shard1:27018"
});
printjson(result);

print("Adding shard2...");
result = adminDB.runCommand({
  addShard: "shard2ReplSet/shard2:27018"
});
printjson(result);

// Включаем шардирование
print("Enabling sharding for somedb...");
adminDB.runCommand({
  enableSharding: "somedb"
});

var somedb = db.getSiblingDB("somedb");

// Создаем коллекцию
somedb.createCollection("helloDoc");

// ВАЖНО: создаем хешированный индекс для шардирования
print("Creating hashed index on name...");
somedb.helloDoc.createIndex({ name: "hashed" });

// Включаем шардирование коллекции с хешированным ключом
print("Sharding collection with hashed key...");
adminDB.runCommand({
  shardCollection: "somedb.helloDoc",
  key: { name: "hashed" }  // используем hashed вместо 1
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