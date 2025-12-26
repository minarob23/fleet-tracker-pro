# WhatsApp Configuration Guide

## Overview

This guide explains how to configure WhatsApp notifications for the fleet tracking system.

---

## Current Implementation

The system currently uses **WhatsApp Web links** which open WhatsApp but require manual sending. For automatic notifications, you need to integrate with WhatsApp Business API.

---

## Option 1: WhatsApp Web Links (Current - Simple)

**Pros:**
- No API setup required
- Works immediately
- Free

**Cons:**
- Requires manual message sending
- Opens WhatsApp app/web
- Not suitable for automation

**Configuration:**

Update `server/.env` with recipient phone numbers:
```env
WHATSAPP_LAAYOUNE=212612345678
WHATSAPP_DAKHLA=212612345679
WHATSAPP_SMARA=212612345680
WHATSAPP_GUELMIM=212612345681
```

**Phone Number Format:**
- Morocco: `212` + 9 digits (e.g., `212612345678`)
- Remove any spaces, dashes, or plus signs
- Include country code without `+`

---

## Option 2: WhatsApp Business API (Official)

**Pros:**
- Fully automated
- Official Meta integration
- Reliable delivery

**Cons:**
- Requires Meta approval
- Monthly costs apply
- Setup complexity

**Setup Steps:**

### 1. Apply for WhatsApp Business API

1. Go to [Meta Business Suite](https://business.facebook.com)
2. Create a Business Account
3. Apply for WhatsApp Business API access
4. Wait for approval (can take several days)

### 2. Get API Credentials

Once approved, you'll receive:
- Phone Number ID
- WhatsApp Business Account ID
- Access Token

### 3. Update Configuration

Add to `server/.env`:
```env
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token
```

### 4. Update Service Code

Modify `server/services/whatsapp-service.ts`:

```typescript
export const sendWhatsAppNotification = async (data: WhatsAppMessage): Promise<boolean> => {
  try {
    const response = await fetch(
      `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: data.to,
          type: 'text',
          text: { body: data.message }
        })
      }
    );

    const result = await response.json();
    
    // Log success
    await pool.query(
      `UPDATE notifications_log SET status = 'sent', sent_at = NOW() 
       WHERE recipient = $1 AND message = $2 AND status = 'pending'`,
      [data.to, data.message]
    );

    return true;
  } catch (error: any) {
    console.error('WhatsApp API error:', error);
    
    await pool.query(
      `UPDATE notifications_log SET status = 'failed', error_message = $1
       WHERE recipient = $2 AND message = $3 AND status = 'pending'`,
      [error.message, data.to, data.message]
    );

    return false;
  }
};
```

---

## Option 3: Twilio WhatsApp API (Recommended)

**Pros:**
- Easier setup than Meta
- Good documentation
- Pay-as-you-go pricing
- Quick approval

**Cons:**
- Costs per message
- Requires Twilio account

**Setup Steps:**

### 1. Create Twilio Account

1. Go to [Twilio](https://www.twilio.com)
2. Sign up for an account
3. Verify your phone number

### 2. Enable WhatsApp

1. Go to Messaging → Try it out → Send a WhatsApp message
2. Follow the sandbox setup instructions
3. For production, apply for WhatsApp Business Profile

### 3. Get Credentials

From Twilio Console:
- Account SID
- Auth Token
- WhatsApp-enabled phone number

### 4. Install Twilio SDK

```bash
npm install twilio
```

### 5. Update Configuration

Add to `server/.env`:
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 6. Update Service Code

Modify `server/services/whatsapp-service.ts`:

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendWhatsAppNotification = async (data: WhatsAppMessage): Promise<boolean> => {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:+${data.to}`,
      body: data.message
    });

    console.log(`✅ WhatsApp sent: ${message.sid}`);

    // Log success
    await pool.query(
      `UPDATE notifications_log SET status = 'sent', sent_at = NOW() 
       WHERE recipient = $1 AND message = $2 AND status = 'pending'`,
      [data.to, data.message]
    );

    return true;
  } catch (error: any) {
    console.error('Twilio error:', error);

    await pool.query(
      `UPDATE notifications_log SET status = 'failed', error_message = $1
       WHERE recipient = $2 AND message = $3 AND status = 'pending'`,
      [error.message, data.to, data.message]
    );

    return false;
  }
};
```

---

## Testing WhatsApp Integration

### Test with cURL (Twilio)

```bash
curl -X POST https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json \
  --data-urlencode "From=whatsapp:+14155238886" \
  --data-urlencode "To=whatsapp:+212612345678" \
  --data-urlencode "Body=Test message from Fleet Tracker" \
  -u YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN
```

### Test Arrival Notification

1. Add a truck with destination "Laayoune"
2. Send GPS update to Laayoune coordinates:
```bash
curl -X POST http://localhost:3001/api/gps/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "GPS001",
    "latitude": 27.1536,
    "longitude": -13.2033,
    "speed": 40
  }'
```
3. Check backend logs for WhatsApp notification
4. Verify message in `notifications_log` table

---

## Message Templates

### Arrival Notification (Arabic)

```
🚛 إشعار وصول شاحنة

رقم الوصول: 5
رقم الشاحنة: ABC-123
السائق: محمد أحمد
بون ليفريزون: BL-20251223-000001
نوع المنتج: دقيق
الوجهة: العيون

تم الوصول بنجاح. يرجى التحقق من الشاحنة.
```

### Custom Template

Edit `server/services/whatsapp-service.ts` to customize the message format.

---

## Monitoring and Logs

### View Notification History

```sql
SELECT 
  recipient,
  message,
  status,
  sent_at,
  error_message,
  created_at
FROM notifications_log
ORDER BY created_at DESC
LIMIT 20;
```

### Check Failed Notifications

```sql
SELECT * FROM notifications_log
WHERE status = 'failed'
ORDER BY created_at DESC;
```

---

## Cost Estimation

### Twilio Pricing (Approximate)

- WhatsApp messages: $0.005 - $0.01 per message
- For 1000 notifications/month: ~$5-10

### WhatsApp Business API Pricing

- Varies by country and volume
- Morocco: ~$0.01 - $0.03 per message
- Monthly platform fee may apply

---

## Best Practices

1. **Rate Limiting**: Don't send too many messages too quickly
2. **Error Handling**: Always log failed notifications
3. **Retry Logic**: Implement retry for failed messages
4. **Template Approval**: Get message templates approved by WhatsApp
5. **Opt-out**: Provide way for users to stop notifications

---

## Support

For issues:
- Check Twilio/Meta documentation
- Review notification logs in database
- Test with sandbox environment first
- Verify phone number formats
