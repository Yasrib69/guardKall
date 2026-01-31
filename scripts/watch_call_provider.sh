#!/bin/bash
set -e

CALL_PROVIDER="${CALL_PROVIDER:-twilio}"

if [ "$CALL_PROVIDER" = "teli" ]; then
  echo "Starting Teli adapter (CALL_PROVIDER=teli)"
  (cd services/teli && npm run dev)
else
  echo "Starting Twilio telephony (CALL_PROVIDER=twilio)"
  TELEPHONY_DIR="services/telephony"
  if [ ! -d "$TELEPHONY_DIR" ]; then
    TELEPHONY_DIR="legacy/services/telephony"
  fi
  if [ ! -d "$TELEPHONY_DIR" ]; then
    echo "Twilio telephony not found. It may have been moved to legacy."
    exit 1
  fi
  (cd "$TELEPHONY_DIR" && npm run dev)
fi
