#!/usr/bin/env bash

cleanup() {
  echo -e "\nShutting down..."
  kill "$frontend_pid" "$backend_pid" 2>/dev/null
  wait
  echo "All processes stopped."
}

trap cleanup SIGINT SIGTERM

ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "$ROOT/ws_server" && cargo run &
backend_pid=$!

cd "$ROOT" && pnpm run dev &
frontend_pid=$!

echo "Frontend (PID: $frontend_pid) and backend (PID: $backend_pid) started."
echo "Press Ctrl+C to stop both."

wait
