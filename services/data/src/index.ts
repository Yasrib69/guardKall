import express from "express";
import dotenv from "dotenv";
import snowflake from "snowflake-sdk";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 4003);
const SF_DB = process.env.SNOWFLAKE_DATABASE || "GUARDKALL";
const SF_SCHEMA = process.env.SNOWFLAKE_SCHEMA || "PUBLIC";
const T_AGENTS = `${SF_DB}.${SF_SCHEMA}.AGENTS`;
const T_CALLS = `${SF_DB}.${SF_SCHEMA}.CALLS`;
const T_USERS = `${SF_DB}.${SF_SCHEMA}.USERS`;
const T_SCAM_EVENTS = `${SF_DB}.${SF_SCHEMA}.SCAM_EVENTS`;

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

// Try to connect and initialize database
connection.connect((err, conn) => {
  if (err) {
    console.error("Unable to connect to Snowflake: " + err.message);
  } else {
    console.log("Successfully connected to Snowflake.");
    // Create database and schema if they don't exist
    connection.execute({
      sqlText: `CREATE DATABASE IF NOT EXISTS ${SF_DB}`,
      complete: (createDbErr) => {
        if (createDbErr) {
          console.error("Failed to create database:", createDbErr.message);
        } else {
          console.log(`Database ${SF_DB} ready`);
          connection.execute({
            sqlText: `CREATE SCHEMA IF NOT EXISTS ${SF_DB}.${SF_SCHEMA}`,
            complete: (createSchemaErr) => {
              if (createSchemaErr) {
                console.error("Failed to create schema:", createSchemaErr.message);
              } else {
                console.log(`Schema ${SF_DB}.${SF_SCHEMA} ready`);
              }
            }
          });
        }
      }
    });
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

// Admin endpoint to reset tables (for development)
app.post("/admin/reset-calls", (_req, res) => {
  connection.execute({
    sqlText: `DROP TABLE IF EXISTS ${T_CALLS}`,
    complete: (err) => {
      if (err) {
        return res.status(500).json({ ok: false, error: err.message });
      }
      res.json({ ok: true, message: "CALLS table dropped" });
    }
  });
});

// ─────────────────────────────────────────────────────────────
// AGENTS - Store voice agent configurations
// ─────────────────────────────────────────────────────────────

app.post("/agents", (req, res) => {
  const { agentId, userId, orgId, tenantId, agentName, voiceId, prompt, startingMessage, teliPhoneNumber, transferNumber } = req.body || {};

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS ${T_AGENTS} (
      AGENT_ID STRING PRIMARY KEY,
      USER_ID STRING,
      ORG_ID STRING,
      TENANT_ID STRING,
      AGENT_NAME STRING,
      VOICE_ID STRING,
      PROMPT STRING,
      STARTING_MESSAGE STRING,
      TELI_PHONE_NUMBER STRING,
      TRANSFER_NUMBER STRING,
      STATUS STRING DEFAULT 'active',
      CREATED_AT TIMESTAMP_NTZ,
      UPDATED_AT TIMESTAMP_NTZ
    )
  `;

  connection.execute({
    sqlText: createTableSql,
    complete: (createErr) => {
      if (createErr) {
        return res.status(500).json({ ok: false, error: createErr.message });
      }

      const id = agentId || `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const insertSql = `
        INSERT INTO ${T_AGENTS} (AGENT_ID, USER_ID, ORG_ID, TENANT_ID, AGENT_NAME, VOICE_ID, PROMPT, STARTING_MESSAGE, TELI_PHONE_NUMBER, TRANSFER_NUMBER, CREATED_AT, UPDATED_AT)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
      `;

      connection.execute({
        sqlText: insertSql,
        binds: [id, userId || "", orgId || "", tenantId || "", agentName || "GuardKall Agent", voiceId || "cartesia-Cleo", prompt || "", startingMessage || "", teliPhoneNumber || "", transferNumber || ""],
        complete: (insertErr) => {
          if (insertErr) {
            return res.status(500).json({ ok: false, error: insertErr.message });
          }
          res.json({ ok: true, agentId: id });
        }
      });
    }
  });
});

app.get("/agents", (req, res) => {
  const { userId, orgId } = req.query;

  let sql = `SELECT * FROM ${T_AGENTS} WHERE STATUS = 'active'`;
  const binds: string[] = [];

  if (userId) {
    sql += " AND USER_ID = ?";
    binds.push(userId as string);
  }
  if (orgId) {
    sql += " AND ORG_ID = ?";
    binds.push(orgId as string);
  }

  connection.execute({
    sqlText: sql,
    binds,
    complete: (err, stmt, rows) => {
      if (err) {
        return res.status(500).json({ ok: false, error: err.message });
      }
      res.json({ ok: true, agents: rows || [] });
    }
  });
});

app.get("/agents/:id", (req, res) => {
  connection.execute({
    sqlText: `SELECT * FROM ${T_AGENTS} WHERE AGENT_ID = ?`,
    binds: [req.params.id],
    complete: (err, stmt, rows) => {
      if (err) {
        return res.status(500).json({ ok: false, error: err.message });
      }
      const agent = rows && rows.length > 0 ? rows[0] : null;
      res.json({ ok: true, agent });
    }
  });
});

app.patch("/agents/:id", (req, res) => {
  const { transferNumber, prompt, startingMessage, voiceId, status } = req.body || {};

  const updates: string[] = [];
  const binds: string[] = [];

  if (transferNumber !== undefined) { updates.push("TRANSFER_NUMBER = ?"); binds.push(transferNumber); }
  if (prompt !== undefined) { updates.push("PROMPT = ?"); binds.push(prompt); }
  if (startingMessage !== undefined) { updates.push("STARTING_MESSAGE = ?"); binds.push(startingMessage); }
  if (voiceId !== undefined) { updates.push("VOICE_ID = ?"); binds.push(voiceId); }
  if (status !== undefined) { updates.push("STATUS = ?"); binds.push(status); }

  if (updates.length === 0) {
    return res.json({ ok: true, message: "no updates" });
  }

  updates.push("UPDATED_AT = CURRENT_TIMESTAMP()");
  binds.push(req.params.id);

  connection.execute({
    sqlText: `UPDATE ${T_AGENTS} SET ${updates.join(", ")} WHERE AGENT_ID = ?`,
    binds,
    complete: (err) => {
      if (err) {
        return res.status(500).json({ ok: false, error: err.message });
      }
      res.json({ ok: true });
    }
  });
});

// ─────────────────────────────────────────────────────────────
// CALLS - Track all call events and transcripts
// ─────────────────────────────────────────────────────────────

app.post("/calls", (req, res) => {
  const { callId, agentId, userId, callerNumber, teliPhoneNumber, status, transcript, verdict, analysis } = req.body || {};

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS ${T_CALLS} (
      CALL_ID STRING PRIMARY KEY,
      AGENT_ID STRING,
      USER_ID STRING,
      CALLER_NUMBER STRING,
      TELI_PHONE_NUMBER STRING,
      STATUS STRING,
      TRANSCRIPT STRING,
      VERDICT STRING,
      ANALYSIS STRING,
      CREATED_AT TIMESTAMP_NTZ,
      UPDATED_AT TIMESTAMP_NTZ
    )
  `;

  connection.execute({
    sqlText: createTableSql,
    complete: (createErr) => {
      if (createErr) {
        return res.status(500).json({ ok: false, error: createErr.message });
      }

      const id = callId || `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const insertSql = `
        INSERT INTO ${T_CALLS} (CALL_ID, AGENT_ID, USER_ID, CALLER_NUMBER, TELI_PHONE_NUMBER, STATUS, TRANSCRIPT, VERDICT, ANALYSIS, CREATED_AT, UPDATED_AT)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
      `;

      connection.execute({
        sqlText: insertSql,
        binds: [id, agentId || "", userId || "", callerNumber || "", teliPhoneNumber || "", status || "in_progress", transcript || "", verdict || "", JSON.stringify(analysis || {})],
        complete: (insertErr) => {
          if (insertErr) {
            return res.status(500).json({ ok: false, error: insertErr.message });
          }
          res.json({ ok: true, callId: id });
        }
      });
    }
  });
});

app.get("/calls", (req, res) => {
  const { userId, agentId, limit } = req.query;

  let sql = `SELECT * FROM ${T_CALLS} WHERE 1=1`;
  const binds: string[] = [];

  if (userId) {
    sql += " AND USER_ID = ?";
    binds.push(userId as string);
  }
  if (agentId) {
    sql += " AND AGENT_ID = ?";
    binds.push(agentId as string);
  }

  sql += " ORDER BY CREATED_AT DESC";
  sql += ` LIMIT ${parseInt(limit as string) || 50}`;

  connection.execute({
    sqlText: sql,
    binds,
    complete: (err, stmt, rows) => {
      if (err) {
        return res.status(500).json({ ok: false, error: err.message });
      }
      res.json({ ok: true, calls: rows || [] });
    }
  });
});

app.patch("/calls/:id", (req, res) => {
  const { status, transcript, verdict, analysis } = req.body || {};

  const updates: string[] = [];
  const binds: (string | null)[] = [];

  if (status !== undefined) { updates.push("STATUS = ?"); binds.push(status); }
  if (transcript !== undefined) { updates.push("TRANSCRIPT = ?"); binds.push(transcript); }
  if (verdict !== undefined) { updates.push("VERDICT = ?"); binds.push(verdict); }
  if (analysis !== undefined) { updates.push("ANALYSIS = ?"); binds.push(JSON.stringify(analysis)); }

  if (updates.length === 0) {
    return res.json({ ok: true, message: "no updates" });
  }

  updates.push("UPDATED_AT = CURRENT_TIMESTAMP()");
  binds.push(req.params.id);

  connection.execute({
    sqlText: `UPDATE ${T_CALLS} SET ${updates.join(", ")} WHERE CALL_ID = ?`,
    binds,
    complete: (err) => {
      if (err) {
        return res.status(500).json({ ok: false, error: err.message });
      }
      res.json({ ok: true });
    }
  });
});

app.post("/users", (req, res) => {
  const payload = req.body || {};
  const { fullName, email, phone, risk, channel } = payload;
  console.log(`[Data] Registering user: ${email}`);

  // First, ensure table exists
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS ${T_USERS} (
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
        INSERT INTO ${T_USERS} (EMAIL, FULL_NAME, PHONE, RISK_SCENARIO, ALERT_CHANNEL, CREATED_AT)
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

// List all registered users (for call routing - newest first)
app.get("/users", (req, res) => {
  connection.execute({
    sqlText: `SELECT * FROM ${T_USERS} ORDER BY CREATED_AT DESC`,
    complete: (err, stmt, rows) => {
      if (err) {
        if (err.message.includes("does not exist")) {
          return res.json({ ok: true, users: [] });
        }
        return res.status(500).json({ ok: false, error: err.message });
      }

      const users = (rows || []).map((row: any) => ({
        id: row.EMAIL, // Use email as ID
        firstName: (row.FULL_NAME || "").split(" ")[0] || "",
        lastName: (row.FULL_NAME || "").split(" ").slice(1).join(" ") || "",
        email: row.EMAIL,
        phoneNumber: row.PHONE,
        createdAt: row.CREATED_AT
      }));
      res.json({ ok: true, users });
    }
  });
});

app.post("/events", (req, res) => {
  const payload = req.body || {};
  const { callSid, label, confidence, reasons } = payload;

  console.log(`[Data] Received event: ${JSON.stringify(payload)}`);

  // Insert into Snowflake
  const sqlText = `
    INSERT INTO ${T_SCAM_EVENTS} (CALL_SID, LABEL, CONFIDENCE, REASONS, CREATED_AT)
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
