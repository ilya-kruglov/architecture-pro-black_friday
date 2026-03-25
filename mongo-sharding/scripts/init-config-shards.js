// Функция для ожидания готовности репликасета
function waitForPrimary(rsName, timeoutSecs = 30) {
  var startTime = Date.now();
  while ((Date.now() - startTime) / 1000 < timeoutSecs) {
    try {
      var status = rs.status();
      if (status.ok === 1 && status.myState === 1) {
        print(rsName + " is PRIMARY");
        return true;
      }
    } catch (e) {
      print("Waiting for " + rsName + "... " + e.message);
    }
    sleep(2000);
  }
  print("Timeout waiting for " + rsName);
  return false;
}

// Инициализация config server (используем rs.initiate)
print("=== Initializing Config Server ===");
var configConn = new Mongo("configsvr:27019");
var configDB = configConn.getDB("admin");

configDB.adminCommand({
  replSetInitiate: {
    _id: "configReplSet",
    configsvr: true,
    members: [{ _id: 0, host: "configsvr:27019" }]
  }
});

sleep(3000);
waitForPrimary("configReplSet");

// Инициализация shard1
print("=== Initializing Shard 1 ===");
var shard1Conn = new Mongo("shard1:27018");
var shard1DB = shard1Conn.getDB("admin");

shard1DB.adminCommand({
  replSetInitiate: {
    _id: "shard1ReplSet",
    members: [{ _id: 0, host: "shard1:27018" }]
  }
});

sleep(3000);
waitForPrimary("shard1ReplSet");

// Инициализация shard2
print("=== Initializing Shard 2 ===");
var shard2Conn = new Mongo("shard2:27018");
var shard2DB = shard2Conn.getDB("admin");

shard2DB.adminCommand({
  replSetInitiate: {
    _id: "shard2ReplSet",
    members: [{ _id: 0, host: "shard2:27018" }]
  }
});

sleep(3000);
waitForPrimary("shard2ReplSet");

print("=== All replica sets initialized ===");