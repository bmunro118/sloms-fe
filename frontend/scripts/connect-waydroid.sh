#!/usr/bin/env bash
set -e

# Detect Waydroid IP
WAYDROID_IP=$(waydroid status 2>/dev/null | grep "IP address" | awk '{print $NF}')

if [ -z "$WAYDROID_IP" ]; then
  echo "Waydroid is not running. Start Waydroid first with 'waydroid session start'."
  exit 1
fi

echo "Connecting ADB to Waydroid ($WAYDROID_IP:5555)..."
adb connect "$WAYDROID_IP:5555"

echo "Configuring reverse port forwarding (3000 for backend, 8081 for Metro)..."
adb -s "$WAYDROID_IP:5555" reverse tcp:3000 tcp:3000
adb -s "$WAYDROID_IP:5555" reverse tcp:8081 tcp:8081

echo "Waydroid is connected and port forwarding is active."
