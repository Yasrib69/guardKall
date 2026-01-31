import express from "express";
import dotenv from "dotenv";
import snowflake from "snowflake-sdk";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 4003);

// Initialize Snowflake Connection
const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT || "",
  username: process.env.SNOWFLAKE_USERNAME || "",
  password: process.env.SNOWFLAKE_PASSWORD || "",
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  role: process.env.SNOWFLAKE_ROLE,
});

// Try to connect
connection.connect((err, conn) => {
  if (err) {
    console.error("Unable to connect to Snowflake: " + err.message);
  } else {
    console.log("Successfully connected to Snowflake.");
  }
});

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/users", (req, res) => {
  const payload = req.body || {};
  const { fullName, email, phone, risk, channel } = payload;
  console.log(`[Data] Registering user: ${email}`);

  // First, ensure table exists
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS USERS (
      EMAIL STRING, 
      FULL_NAME STRING, 
      PHONE STRING, 
      RISK_SCENARIO STRING, 
      ALERT_CHANNEL STRING,
      CREATED_AT TIMESTAMP_NTZ
    )
  `;

  connection.execute({
    sqlText: createTableSql,
    complete: (createErr) => {
      if (createErr) {
        console.error("Snowflake create table error:", createErr.message);
        res.status(500).json({ ok: false, error: createErr.message });
        return;
      }

      // Then insert the user
      const insertSql = `
        INSERT INTO USERS (EMAIL, FULL_NAME, PHONE, RISK_SCENARIO, ALERT_CHANNEL, CREATED_AT)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP())
      `;

      const binds = [
        email || "",
        fullName || "",
        phone || "",
        risk || "",
        channel || ""
      ];

      connection.execute({
        sqlText: insertSql,
        binds: binds,
        complete: (insertErr, stmt, rows) => {
          if (insertErr) {
            console.error("Snowflake user insert error:", insertErr.message);
            res.status(500).json({ ok: false, error: insertErr.message });
          } else {
            console.log(`[Data] Registered user ${email}`);
            res.json({ ok: true });
          }
        }
      });
    }
  });
});

app.post("/events", (req, res) => {
  const payload = req.body || {};
  const { callSid, label, confidence, reasons } = payload;

  console.log(`[Data] Received event: ${JSON.stringify(payload)}`);

  // Insert into Snowflake
  const sqlText = `
    INSERT INTO SCAM_EVENTS (CALL_SID, LABEL, CONFIDENCE, REASONS, CREATED_AT)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP())
  `;

  const binds = [
    callSid || "unknown",
    label || "UNKNOWN",
    confidence || 0,
    JSON.stringify(reasons || [])
  ];

  connection.execute({
    sqlText: sqlText,
    binds: binds,
    complete: (err, stmt, rows) => {
      if (err) {
        console.error("Snowflake insert error:", err.message);
        // Don't fail the request, just log
        res.json({ ok: false, error: err.message });
      } else {
        console.log(`[Data] Persisted event for ${callSid}`);
        res.json({ ok: true, rows: rows });
      }
    }
  });
});

app.post("/fingerprint", (req, res) => {
  // TODO: Implement fingerprint matching if needed for prize
  res.json({ match: false });
});

app.listen(PORT, () => {
  console.log(`data service listening on :${PORT}`);
});
