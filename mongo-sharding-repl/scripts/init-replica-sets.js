// Функция для ожидания готовности репликасета
function waitForPrimary(rsName, timeoutSecs = 60) {
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
    sleep(3000);
  }
  print("Timeout waiting for " + rsName);
  return false;
}

// ==========================================
// 1. Инициализация Config Server Replica Set
// ==========================================
print("=== Initializing Config Server Replica Set ===");
var configConn = new Mongo("configsvr1:27019");
var configDB = configConn.getDB("admin");

configDB.adminCommand({
  replSetInitiate: {
    _id: "configReplSet",
    configsvr: true,
    members: [
      { _id: 0, host: "configsvr1:27019" },
      { _id: 1, host: "configsvr2:27019" },
      { _id: 2, host: "configsvr3:27019" }
    ]
  }
});

sleep(5000);
waitForPrimary("configReplSet");

// ==========================================
// 2. Инициализация Shard 1 Replica Set
// ==========================================
print("=== Initializing Shard 1 Replica Set ===");
var shard1Conn = new Mongo("shard1-1:27018");
var shard1DB = shard1Conn.getDB("admin");

shard1DB.adminCommand({
  replSetInitiate: {
    _id: "shard1ReplSet",
    members: [
      { _id: 0, host: "shard1-1:27018" },
      { _id: 1, host: "shard1-2:27018" },
      { _id: 2, host: "shard1-3:27018" }
    ]
  }
});

sleep(5000);
waitForPrimary("shard1ReplSet");

// ==========================================
// 3. Инициализация Shard 2 Replica Set
// ==========================================
print("=== Initializing Shard 2 Replica Set ===");
var shard2Conn = new Mongo("shard2-1:27018");
var shard2DB = shard2Conn.getDB("admin");

shard2DB.adminCommand({
  replSetInitiate: {
    _id: "shard2ReplSet",
    members: [
      { _id: 0, host: "shard2-1:27018" },
      { _id: 1, host: "shard2-2:27018" },
      { _id: 2, host: "shard2-3:27018" }
    ]
  }
});

sleep(5000);
waitForPrimary("shard2ReplSet");

print("=== All replica sets initialized ===");
print("Config Server Replica Set: 3 nodes");
print("Shard 1 Replica Set: 3 nodes");
print("Shard 2 Replica Set: 3 nodes");