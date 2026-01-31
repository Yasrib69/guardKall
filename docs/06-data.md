# Data service (Snowflake API)

## Purpose
Store scam script fingerprints to match future calls even when numbers change.

## Schema (proposal)
- table: scam_scripts
  - id (uuid)
  - fingerprint (string, hashed n-gram or embedding ID)
  - sample_snippet (string)
  - created_at (timestamp)
  - source_call_id (string)

- table: scam_events
  - id (uuid)
  - call_id (string)
  - label (string)
  - confidence (float)
  - reasons (variant)
  - created_at (timestamp)

## Matching
- Simple approach: store hashed n-grams and do containment checks
- Better approach: store embeddings and run vector similarity

## API note
- For the prize, use Snowflake’s REST API for inserts/queries.

## Retention
- Keep raw snippets minimal and redact sensitive data
