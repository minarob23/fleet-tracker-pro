# GPS Webhook Testing Guide

## Overview

This guide explains how to test the GPS webhook integration with real GPS devices or simulators.

---

## GPS Webhook Endpoint

**URL**: `http://localhost:3001/api/gps/webhook` (Development)  
**Method**: POST  
**Content-Type**: application/json

For production, replace with your deployed backend URL:
```
https://your-domain.com/api/gps/webhook
```

---

## Supported GPS Data Formats

### 1. Generic JSON Format (Recommended for Testing)

```json
{
  "device_id": "GPS001",
  "latitude": 27.1536,
  "longitude": -13.2033,
  "speed": 65,
  "heading": 180,
  "altitude": 100,
  "accuracy": 10,
  "timestamp": "2025-12-23T02:00:00Z"
}
```

### 2. Teltonika Format

```json
{
  "imei": "352094087982671",
  "records": [
    {
      "lat": 27.1536,
      "lng": -13.2033,
      "speed": 65,
      "direction": 180,
      "altitude": 100,
      "timestamp": 1703289600000
    }
  ]
}
```

### 3. Queclink Format

```json
{
  "deviceId": "GPS001",
  "location": {
    "latitude": 27.1536,
    "longitude": -13.2033,
    "speed": 65,
    "heading": 180
  },
  "timestamp": "2025-12-23T02:00:00Z"
}
```

---

## Testing Methods

### Method 1: Using cURL (Command Line)

**Test 1: Send GPS location to Laayoune**
```bash
curl -X POST http://localhost:3001/api/gps/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "GPS001",
    "latitude": 27.1536,
    "longitude": -13.2033,
    "speed": 65,
    "timestamp": "2025-12-23T02:00:00Z"
  }'
```

**Test 2: Simulate truck arriving at Dakhla**
```bash
curl -X POST http://localhost:3001/api/gps/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "GPS002",
    "latitude": 23.7185,
    "longitude": -15.9582,
    "speed": 45,
    "timestamp": "2025-12-23T03:00:00Z"
  }'
```

**Test 3: Simulate truck entering warehouse**
```bash
curl -X POST http://localhost:3001/api/gps/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "GPS001",
    "latitude": 27.1500,
    "longitude": -13.2000,
    "speed": 5,
    "timestamp": "2025-12-23T04:00:00Z"
  }'
```

### Method 2: Using Postman

1. Open Postman
2. Create a new POST request
3. Set URL: `http://localhost:3001/api/gps/webhook`
4. Set Headers:
   - `Content-Type`: `application/json`
5. Set Body (raw JSON):
```json
{
  "device_id": "GPS001",
  "latitude": 27.1536,
  "longitude": -13.2033,
  "speed": 65,
  "timestamp": "2025-12-23T02:00:00Z"
}
```
6. Click "Send"

### Method 3: Using Python Script

```python
import requests
import json
from datetime import datetime

def send_gps_update(device_id, lat, lng, speed):
    url = "http://localhost:3001/api/gps/webhook"
    
    payload = {
        "device_id": device_id,
        "latitude": lat,
        "longitude": lng,
        "speed": speed,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

# Test: Send location to Laayoune
send_gps_update("GPS001", 27.1536, -13.2033, 65)
```

### Method 4: Using JavaScript/Node.js

```javascript
const axios = require('axios');

async function sendGPSUpdate(deviceId, lat, lng, speed) {
  try {
    const response = await axios.post('http://localhost:3001/api/gps/webhook', {
      device_id: deviceId,
      latitude: lat,
      longitude: lng,
      speed: speed,
      timestamp: new Date().toISOString()
    });
    
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Test: Send location to Laayoune
sendGPSUpdate('GPS001', 27.1536, -13.2033, 65);
```

---

## Testing Scenarios

### Scenario 1: Complete Journey Simulation

```bash
# 1. Truck starts journey (waiting status)
curl -X POST http://localhost:3001/api/gps/webhook \
  -H "Content-Type: application/json" \
  -d '{"device_id": "GPS001", "latitude": 33.5731, "longitude": -7.5898, "speed": 0}'

# 2. Truck en route (moving toward Laayoune)
curl -X POST http://localhost:3001/api/gps/webhook \
  -H "Content-Type: application/json" \
  -d '{"device_id": "GPS001", "latitude": 30.4278, "longitude": -9.5981, "speed": 80}'

# 3. Truck arrives at Laayoune (enters city geofence)
curl -X POST http://localhost:3001/api/gps/webhook \
  -H "Content-Type: application/json" \
  -d '{"device_id": "GPS001", "latitude": 27.1536, "longitude": -13.2033, "speed": 40}'

# 4. Truck enters warehouse (depot status)
curl -X POST http://localhost:3001/api/gps/webhook \
  -H "Content-Type: application/json" \
  -d '{"device_id": "GPS001", "latitude": 27.1500, "longitude": -13.2000, "speed": 5}'
```

### Scenario 2: Multiple Trucks

```bash
# Truck 1 to Laayoune
curl -X POST http://localhost:3001/api/gps/webhook \
  -H "Content-Type: application/json" \
  -d '{"device_id": "GPS001", "latitude": 27.1536, "longitude": -13.2033, "speed": 60}'

# Truck 2 to Dakhla
curl -X POST http://localhost:3001/api/gps/webhook \
  -H "Content-Type: application/json" \
  -d '{"device_id": "GPS002", "latitude": 23.7185, "longitude": -15.9582, "speed": 55}'

# Truck 3 to Smara
curl -X POST http://localhost:3001/api/gps/webhook \
  -H "Content-Type: application/json" \
  -d '{"device_id": "GPS003", "latitude": 26.7386, "longitude": -11.6719, "speed": 70}'
```

---

## Verifying GPS Updates

### 1. Check Backend Logs

Watch the backend console for messages like:
```
📱 WhatsApp notification to 212600000001: ...
🚛 Truck ABC-123 has arrived at Laayoune
📦 Truck ABC-123 has entered warehouse at Laayoune
```

### 2. Check Database

```sql
-- View GPS location history
SELECT * FROM gps_locations 
ORDER BY created_at DESC 
LIMIT 10;

-- View webhook logs
SELECT * FROM gps_webhooks_log 
ORDER BY created_at DESC 
LIMIT 10;

-- View truck status updates
SELECT plate_number, status, latitude, longitude, speed, updated_at 
FROM trucks 
ORDER BY updated_at DESC;
```

### 3. Check Frontend

1. Open http://localhost:5173
2. Login with any account
3. Watch the map for truck markers updating
4. Check the reporting table for status changes

---

## Configuring Real GPS Devices

### Step 1: Register GPS Device

```bash
curl -X POST http://localhost:3001/api/gps/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "device_id": "GPS001",
    "device_type": "teltonika",
    "imei": "352094087982671",
    "phone_number": "+212600000001",
    "truck_id": "truck-uuid-here"
  }'
```

### Step 2: Configure Device to Send Data

Configure your GPS device to send HTTP POST requests to:
```
https://your-domain.com/api/gps/webhook
```

**Recommended Settings:**
- Update interval: 30-60 seconds
- Protocol: HTTP/HTTPS
- Method: POST
- Content-Type: application/json

### Step 3: Test Connection

Send a test payload from your device and verify it appears in the webhook logs.

---

## Troubleshooting

### Issue: Webhook returns 400 "Invalid GPS payload"

**Solution**: Check that your payload includes required fields:
- `device_id` (required)
- `latitude` (required)
- `longitude` (required)

### Issue: Truck location not updating on map

**Solution**: 
1. Verify GPS device is registered and linked to a truck
2. Check `gps_devices` table for device-to-truck mapping
3. Verify truck exists in `trucks` table

### Issue: Geofencing not triggering

**Solution**:
1. Verify geofences exist in `city_geofences` table
2. Check coordinates and radius are correct
3. Ensure truck has a valid `destination` field

### Issue: WhatsApp notifications not sending

**Solution**:
1. Check WhatsApp phone numbers in `.env`
2. Verify notification logs in `notifications_log` table
3. For production, integrate with WhatsApp Business API

---

## Production Deployment

### 1. Update Webhook URL

Configure your GPS devices to send data to:
```
https://your-production-domain.com/api/gps/webhook
```

### 2. Add Webhook Security (Optional)

Set `GPS_WEBHOOK_SECRET` in `.env` and verify it in the webhook handler.

### 3. Monitor Webhook Performance

- Set up logging and monitoring
- Track webhook success/failure rates
- Monitor database performance

---

## Support

For issues or questions:
- Check backend console logs
- Review `gps_webhooks_log` table for errors
- Verify GPS device configuration
- Test with cURL first before using real devices
