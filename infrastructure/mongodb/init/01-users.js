// Runs once on first container startup (inside aptghana_v2 database context)
// Environment variables are injected by the MongoDB container.

const appPassword = process.env.MONGO_APP_PASSWORD;
const appUser     = process.env.MONGO_APP_USER;
const dbName      = process.env.MONGO_INITDB_DATABASE;

if (!appPassword) {
  throw new Error(
    "MONGO_APP_PASSWORD is required — cannot initialise MongoDB without it. " +
    "Set this variable before starting the container."
  );
}
if (!appUser) {
  throw new Error("MONGO_APP_USER is required — cannot initialise MongoDB without it.");
}
if (!dbName) {
  throw new Error("MONGO_INITDB_DATABASE is required — cannot initialise MongoDB without it.");
}

const db = db.getSiblingDB(dbName);

// Application user: read-write on the application database only
db.createUser({
  user:  appUser,
  pwd:   appPassword,
  roles: [{ role: "readWrite", db: dbName }],
});

// Backup user: read-only — used by the mongodb-backup service
const backupPassword = process.env.MONGO_BACKUP_PASSWORD;
if (backupPassword) {
  db.createUser({
    user:  "aptghana_backup",
    pwd:   backupPassword,
    roles: [{ role: "read", db: dbName }],
  });
  print("aptghana_backup user created (read-only)");
} else {
  print("WARNING: MONGO_BACKUP_PASSWORD not set — backup user was NOT created.");
}

print("MongoDB init complete — users created for database: " + dbName);
