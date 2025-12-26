const TelegramBot = require('node-telegram-bot-api');
const { Pool } = require('pg');
require('dotenv').config();

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Initialize PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ===== SECURITY SYSTEM =====

// Level 1: Whitelist (Trusted Users - Admins)
const getTrustedUsers = () => {
    const users = process.env.TELEGRAM_TRUSTED_USERS || '';
    return users.split(',').filter(id => id.trim());
};

// Level 2: Invite Codes (stored in database)
const inviteCodes = new Map(); // In-memory cache for quick lookup

// Level 3: Pending Approvals
const pendingApprovals = new Map();

// User sessions (device_id mapping + authorization status)
const userSessions = new Map();

// Security Middleware
async function isAuthorized(chatId) {
    const chatIdStr = chatId.toString();

    // Level 1: Check if trusted user (admin)
    if (getTrustedUsers().includes(chatIdStr)) {
        return { authorized: true, level: 'admin', reason: 'Trusted user' };
    }

    // Level 2: Check if user has active session
    const session = userSessions.get(chatId);
    if (session && session.authorized) {
        return { authorized: true, level: 'user', reason: 'Active session' };
    }

    return { authorized: false, level: null, reason: 'Not authorized' };
}

// Load invite codes from database on startup
async function loadInviteCodes() {
    try {
        const result = await pool.query(
            'SELECT code, device_id, created_by, expires_at, used FROM telegram_invites WHERE used = false AND expires_at > NOW()'
        );

        result.rows.forEach(row => {
            inviteCodes.set(row.code, {
                deviceId: row.device_id,
                createdBy: row.created_by,
                expiresAt: row.expires_at
            });
        });

        console.log(`✅ Loaded ${inviteCodes.size} active invite codes`);
    } catch (error) {
        console.error('Error loading invite codes:', error);
    }
}

// Initialize database tables
async function initDatabase() {
    try {
        // Create telegram_invites table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS telegram_invites (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        device_id VARCHAR(50) NOT NULL,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        used_by BIGINT,
        used_at TIMESTAMP
      )
    `);

        // Create telegram_users table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS telegram_users (
        chat_id BIGINT PRIMARY KEY,
        device_id VARCHAR(50) NOT NULL,
        username VARCHAR(100),
        first_name VARCHAR(100),
        authorized BOOLEAN DEFAULT false,
        authorization_method VARCHAR(20),
        authorized_at TIMESTAMP,
        authorized_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

        console.log('✅ Database tables initialized');
        await loadInviteCodes();
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// ===== BOT COMMANDS =====

console.log('🤖 Telegram Bot Started!');
console.log('Bot Username:', process.env.TELEGRAM_BOT_USERNAME || 'Not set');

// Initialize database
initDatabase();

// /start command
bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'المستخدم';
    const param = match[1].trim();

    // Check if starting with invite code
    if (param && param.startsWith(' ')) {
        const inviteCode = param.trim();
        return handleInviteCode(chatId, inviteCode, msg.from);
    }

    // Check authorization
    const auth = await isAuthorized(chatId);

    if (auth.authorized) {
        const welcomeMessage = `
مرحباً ${userName}! 👋

أنت مصرح لك باستخدام بوت تتبع الشاحنات 🚛

*الأوامر المتاحة:*
${auth.level === 'admin' ? '/invite - إنشاء كود دعوة جديد\n/approve - الموافقة على طلب\n/users - عرض المستخدمين\n' : ''}/register - تسجيل معرف الجهاز
/location - إرسال موقعك الحالي
/status - عرض حالة التتبع
/stop - إيقاف التتبع
/help - عرض المساعدة

دعنا نبدأ! 🚀
    `;

        return bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    }

    // Not authorized - request access
    const requestMessage = `
مرحباً ${userName}! 👋

هذا البوت خاص بالمكتب الوطني للحبوب والقطاني (ONICL) لتتبع الشاحنات 🚛

*للحصول على صلاحية الوصول:*

1️⃣ إذا كان لديك كود دعوة:
   /activate YOUR_CODE

2️⃣ طلب موافقة من المدير:
   /request_access

⚠️ لا يمكنك استخدام البوت بدون تصريح
  `;

    await bot.sendMessage(chatId, requestMessage, { parse_mode: 'Markdown' });
});

// /activate command - Use invite code
bot.onText(/\/activate (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const code = match[1].trim().toUpperCase();

    await handleInviteCode(chatId, code, msg.from);
});

// Handle invite code activation
async function handleInviteCode(chatId, code, userInfo) {
    const invite = inviteCodes.get(code);

    if (!invite) {
        return bot.sendMessage(chatId, '❌ كود الدعوة غير صحيح أو منتهي الصلاحية');
    }

    try {
        // Mark invite as used
        await pool.query(
            'UPDATE telegram_invites SET used = true, used_by = $1, used_at = NOW() WHERE code = $2',
            [chatId, code]
        );

        // Create user session
        await pool.query(
            `INSERT INTO telegram_users (chat_id, device_id, username, first_name, authorized, authorization_method, authorized_at)
       VALUES ($1, $2, $3, $4, true, 'invite_code', NOW())
       ON CONFLICT (chat_id) DO UPDATE SET authorized = true, authorization_method = 'invite_code', authorized_at = NOW()`,
            [chatId, invite.deviceId, userInfo.username, userInfo.first_name]
        );

        // Update session
        userSessions.set(chatId, {
            deviceId: invite.deviceId,
            authorized: true,
            authorizedAt: new Date(),
            method: 'invite_code'
        });

        // Remove from cache
        inviteCodes.delete(code);

        await bot.sendMessage(chatId, `
✅ *تم تفعيل حسابك بنجاح!*

*معرف الجهاز:* ${invite.deviceId}

يمكنك الآن استخدام جميع أوامر البوت:
/location - إرسال موقعك
/status - عرض حالتك
/help - المساعدة

مرحباً بك! 🚛
    `, { parse_mode: 'Markdown' });

        // Notify admin
        if (process.env.TELEGRAM_ADMIN_CHAT_ID) {
            await bot.sendMessage(process.env.TELEGRAM_ADMIN_CHAT_ID, `
✅ *مستخدم جديد تم تفعيله*

*الاسم:* ${userInfo.first_name}
*Username:* @${userInfo.username || 'لا يوجد'}
*Chat ID:* ${chatId}
*معرف الجهاز:* ${invite.deviceId}
*الطريقة:* كود دعوة
      `, { parse_mode: 'Markdown' });
        }

    } catch (error) {
        console.error('Activation error:', error);
        await bot.sendMessage(chatId, '❌ حدث خطأ في التفعيل. يرجى المحاولة لاحقاً');
    }
}

// /request_access command - Request admin approval
bot.onText(/\/request_access/, async (msg) => {
    const chatId = msg.chat.id;
    const userInfo = msg.from;

    // Check if already authorized
    const auth = await isAuthorized(chatId);
    if (auth.authorized) {
        return bot.sendMessage(chatId, '✅ أنت مصرح لك بالفعل!');
    }

    // Check if already pending
    if (pendingApprovals.has(chatId)) {
        return bot.sendMessage(chatId, '⏳ طلبك قيد المراجعة. يرجى الانتظار...');
    }

    // Add to pending
    pendingApprovals.set(chatId, {
        userInfo,
        requestedAt: new Date()
    });

    await bot.sendMessage(chatId, `
📨 *تم إرسال طلبك للمدير*

سيتم مراجعة طلبك قريباً.
ستتلقى إشعاراً عند الموافقة.

⏳ يرجى الانتظار...
  `, { parse_mode: 'Markdown' });

    // Notify admin
    if (process.env.TELEGRAM_ADMIN_CHAT_ID) {
        await bot.sendMessage(process.env.TELEGRAM_ADMIN_CHAT_ID, `
🔔 *طلب وصول جديد*

*الاسم:* ${userInfo.first_name} ${userInfo.last_name || ''}
*Username:* @${userInfo.username || 'لا يوجد'}
*Chat ID:* \`${chatId}\`

*للموافقة:* /approve_${chatId}
*للرفض:* /reject_${chatId}
    `, { parse_mode: 'Markdown' });
    }
});

// /approve command - Admin approves user
bot.onText(/\/approve_(\d+)/, async (msg, match) => {
    const adminChatId = msg.chat.id;
    const targetChatId = parseInt(match[1]);

    // Check if admin
    const auth = await isAuthorized(adminChatId);
    if (auth.level !== 'admin') {
        return bot.sendMessage(adminChatId, '⛔ هذا الأمر للمديرين فقط');
    }

    const pending = pendingApprovals.get(targetChatId);
    if (!pending) {
        return bot.sendMessage(adminChatId, '❌ لا يوجد طلب من هذا المستخدم');
    }

    // Ask for device ID
    await bot.sendMessage(adminChatId, `
يرجى إدخال معرف الجهاز للمستخدم:

/set_device_${targetChatId}_GPS001

استبدل GPS001 بالمعرف الصحيح
  `);
});

// /set_device command - Set device ID and approve
bot.onText(/\/set_device_(\d+)_(.+)/, async (msg, match) => {
    const adminChatId = msg.chat.id;
    const targetChatId = parseInt(match[1]);
    const deviceId = match[2].trim();

    // Check if admin
    const auth = await isAuthorized(adminChatId);
    if (auth.level !== 'admin') {
        return bot.sendMessage(adminChatId, '⛔ هذا الأمر للمديرين فقط');
    }

    const pending = pendingApprovals.get(targetChatId);
    if (!pending) {
        return bot.sendMessage(adminChatId, '❌ لا يوجد طلب من هذا المستخدم');
    }

    try {
        // Authorize user
        await pool.query(
            `INSERT INTO telegram_users (chat_id, device_id, username, first_name, authorized, authorization_method, authorized_at, authorized_by)
       VALUES ($1, $2, $3, $4, true, 'admin_approval', NOW(), $5)
       ON CONFLICT (chat_id) DO UPDATE SET authorized = true, device_id = $2, authorization_method = 'admin_approval', authorized_at = NOW(), authorized_by = $5`,
            [targetChatId, deviceId, pending.userInfo.username, pending.userInfo.first_name, adminChatId]
        );

        // Update session
        userSessions.set(targetChatId, {
            deviceId,
            authorized: true,
            authorizedAt: new Date(),
            method: 'admin_approval'
        });

        // Remove from pending
        pendingApprovals.delete(targetChatId);

        // Notify user
        await bot.sendMessage(targetChatId, `
✅ *تمت الموافقة على طلبك!*

*معرف الجهاز:* ${deviceId}

يمكنك الآن استخدام البوت:
/location - إرسال موقعك
/status - عرض حالتك

مرحباً بك! 🚛
    `, { parse_mode: 'Markdown' });

        // Confirm to admin
        await bot.sendMessage(adminChatId, `
✅ تمت الموافقة على المستخدم

*Chat ID:* ${targetChatId}
*معرف الجهاز:* ${deviceId}
    `, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error('Approval error:', error);
        await bot.sendMessage(adminChatId, '❌ حدث خطأ في الموافقة');
    }
});

// /reject command - Admin rejects user
bot.onText(/\/reject_(\d+)/, async (msg, match) => {
    const adminChatId = msg.chat.id;
    const targetChatId = parseInt(match[1]);

    // Check if admin
    const auth = await isAuthorized(adminChatId);
    if (auth.level !== 'admin') {
        return bot.sendMessage(adminChatId, '⛔ هذا الأمر للمديرين فقط');
    }

    const pending = pendingApprovals.get(targetChatId);
    if (!pending) {
        return bot.sendMessage(adminChatId, '❌ لا يوجد طلب من هذا المستخدم');
    }

    // Remove from pending
    pendingApprovals.delete(targetChatId);

    // Notify user
    await bot.sendMessage(targetChatId, `
❌ *تم رفض طلبك*

للأسف، لا يمكنك استخدام هذا البوت.
يرجى التواصل مع المدير للمزيد من المعلومات.
  `, { parse_mode: 'Markdown' });

    // Confirm to admin
    await bot.sendMessage(adminChatId, `✅ تم رفض الطلب من ${targetChatId}`);
});

// /invite command - Admin creates invite code
bot.onText(/\/invite (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const deviceId = match[1].trim();

    // Check if admin
    const auth = await isAuthorized(chatId);
    if (auth.level !== 'admin') {
        return bot.sendMessage(chatId, '⛔ هذا الأمر للمديرين فقط');
    }

    try {
        // Generate unique code
        const code = `QT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Save to database
        await pool.query(
            'INSERT INTO telegram_invites (code, device_id, created_by, expires_at) VALUES ($1, $2, $3, $4)',
            [code, deviceId, chatId, expiresAt]
        );

        // Add to cache
        inviteCodes.set(code, {
            deviceId,
            createdBy: chatId,
            expiresAt
        });

        const inviteLink = `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${code}`;

        await bot.sendMessage(chatId, `
✅ *تم إنشاء كود دعوة جديد*

*الكود:* \`${code}\`
*معرف الجهاز:* ${deviceId}
*صالح حتى:* ${expiresAt.toLocaleString('ar-SA')}

*رابط الدعوة:*
${inviteLink}

*للاستخدام:*
أرسل الرابط للسائق، أو اطلب منه إرسال:
\`/activate ${code}\`

⏰ الكود صالح لمدة 24 ساعة
    `, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error('Invite creation error:', error);
        await bot.sendMessage(chatId, '❌ حدث خطأ في إنشاء كود الدعوة');
    }
});

// Security check for all other commands
async function checkAuthBeforeCommand(chatId, commandName) {
    const auth = await isAuthorized(chatId);

    if (!auth.authorized) {
        await bot.sendMessage(chatId, `
⛔ *غير مصرح*

لا يمكنك استخدام هذا الأمر.

*للحصول على صلاحية:*
- إذا كان لديك كود: /activate YOUR_CODE
- أو اطلب موافقة: /request_access
    `, { parse_mode: 'Markdown' });
        return false;
    }

    return true;
}

// /register command (with security check)
bot.onText(/\/register (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;

    if (!await checkAuthBeforeCommand(chatId, 'register')) return;

    const deviceId = match[1].trim();
    const session = userSessions.get(chatId);

    if (session && session.deviceId !== deviceId) {
        return bot.sendMessage(chatId, `⚠️ معرف جهازك المسجل هو: ${session.deviceId}`);
    }

    userSessions.set(chatId, {
        ...session,
        deviceId,
        registeredAt: new Date()
    });

    await bot.sendMessage(chatId, `
✅ تم التسجيل بنجاح!

*معرف الجهاز:* ${deviceId}

الآن يمكنك إرسال موقعك باستخدام:
📍 /location - أو اضغط على زر المرفقات وأرسل موقعك
  `, { parse_mode: 'Markdown' });
});

// /location command (with security check)
bot.onText(/\/location/, async (msg) => {
    const chatId = msg.chat.id;

    if (!await checkAuthBeforeCommand(chatId, 'location')) return;

    const session = userSessions.get(chatId);

    if (!session || !session.deviceId) {
        return bot.sendMessage(chatId, '⚠️ يرجى التسجيل أولاً باستخدام:\n/register GPS001');
    }

    await bot.sendMessage(chatId, 'يرجى مشاركة موقعك الحالي 📍', {
        reply_markup: {
            keyboard: [[{
                text: '📍 مشاركة الموقع',
                request_location: true
            }]],
            one_time_keyboard: true,
            resize_keyboard: true
        }
    });
});

// /status command (with security check)
bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;

    if (!await checkAuthBeforeCommand(chatId, 'status')) return;

    const session = userSessions.get(chatId);

    if (!session || !session.deviceId) {
        return bot.sendMessage(chatId, '⚠️ لم تقم بالتسجيل بعد\n\nاستخدم: /register GPS001');
    }

    try {
        const result = await pool.query(
            'SELECT * FROM trucks WHERE gps_number = $1 ORDER BY last_update DESC LIMIT 1',
            [session.deviceId]
        );

        if (result.rows.length === 0) {
            return bot.sendMessage(chatId, `
📊 *حالة التتبع*

*معرف الجهاز:* ${session.deviceId}
*الحالة:* لا توجد بيانات GPS حتى الآن

يرجى إرسال موقعك باستخدام /location
      `, { parse_mode: 'Markdown' });
        }

        const truck = result.rows[0];
        const lastUpdate = new Date(truck.last_update);
        const timeDiff = Date.now() - lastUpdate.getTime();
        const minutesAgo = Math.floor(timeDiff / 60000);

        await bot.sendMessage(chatId, `
📊 *حالة التتبع*

*معرف الجهاز:* ${session.deviceId}
*رقم الشاحنة:* ${truck.plate_number || 'غير محدد'}
*السائق:* ${truck.driver_name || 'غير محدد'}
*السرعة:* ${truck.speed || 0} كم/س
*آخر تحديث:* منذ ${minutesAgo} دقيقة

✅ التتبع نشط
    `, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Status error:', error);
        await bot.sendMessage(chatId, '❌ حدث خطأ في جلب البيانات');
    }
});

// /stop command (with security check)
bot.onText(/\/stop/, async (msg) => {
    const chatId = msg.chat.id;

    if (!await checkAuthBeforeCommand(chatId, 'stop')) return;

    const session = userSessions.get(chatId);

    if (!session) {
        return bot.sendMessage(chatId, 'لم تكن مسجلاً من الأساس 🤷‍♂️');
    }

    userSessions.delete(chatId);
    await bot.sendMessage(chatId, `
⏹️ تم إيقاف التتبع

تم حذف بياناتك من الجلسة الحالية.
ستبقى مصرحاً لك باستخدام البوت.

للبدء من جديد، استخدم /register
  `);
});

// /help command
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const auth = await isAuthorized(chatId);

    const helpMessage = auth.authorized ? `
📖 *دليل الاستخدام*

*الأوامر المتاحة:*

${auth.level === 'admin' ? `*أوامر المدير:*
/invite GPS001 - إنشاء كود دعوة
/approve_ID - الموافقة على طلب
/reject_ID - رفض طلب

` : ''}/register GPS001 - تسجيل معرف الجهاز
/location - طلب إرسال الموقع
/status - عرض حالة التتبع
/stop - إيقاف التتبع
/help - عرض هذه المساعدة

للدعم، تواصل مع المدير 📞
  ` : `
📖 *مرحباً بك*

هذا البوت خاص بالمكتب الوطني للحبوب والقطاني (ONICL) 🚛

*للحصول على صلاحية:*
/activate YOUR_CODE - إذا كان لديك كود
/request_access - طلب موافقة من المدير

للدعم، تواصل مع المدير 📞
  `;

    await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Handle location messages (with security check)
bot.on('location', async (msg) => {
    const chatId = msg.chat.id;

    if (!await checkAuthBeforeCommand(chatId, 'location')) return;

    const session = userSessions.get(chatId);

    if (!session || !session.deviceId) {
        return bot.sendMessage(chatId, '⚠️ يرجى التسجيل أولاً باستخدام:\n/register GPS001');
    }

    const { latitude, longitude } = msg.location;
    const deviceId = session.deviceId;

    try {
        const result = await pool.query(
            `UPDATE trucks 
       SET latitude = $1, 
           longitude = $2, 
           last_update = NOW(),
           speed = 0
       WHERE gps_number = $3
       RETURNING *`,
            [latitude, longitude, deviceId]
        );

        if (result.rows.length === 0) {
            return bot.sendMessage(chatId, `
⚠️ لم يتم العثور على شاحنة بمعرف: ${deviceId}

يرجى التأكد من معرف الجهاز أو التواصل مع المدير.
      `);
        }

        const truck = result.rows[0];
        const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

        await bot.sendMessage(chatId, `
✅ *تم تحديث موقعك بنجاح!*

*الشاحنة:* ${truck.plate_number || 'غير محدد'}
*الموقع:* ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
*الوقت:* ${new Date().toLocaleTimeString('ar-SA')}

[عرض على الخريطة](${googleMapsLink})

سيظهر موقعك الآن على لوحة التحكم 🗺️
    `, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        });

        if (process.env.TELEGRAM_ADMIN_CHAT_ID) {
            await bot.sendMessage(process.env.TELEGRAM_ADMIN_CHAT_ID, `
📍 *تحديث موقع جديد*

*السائق:* ${truck.driver_name || 'غير محدد'}
*الشاحنة:* ${truck.plate_number || 'غير محدد'}
*معرف الجهاز:* ${deviceId}
*الموقع:* ${latitude.toFixed(6)}, ${longitude.toFixed(6)}

[عرض على الخريطة](${googleMapsLink})
      `, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });
        }

    } catch (error) {
        console.error('Location update error:', error);
        await bot.sendMessage(chatId, `
❌ حدث خطأ في تحديث الموقع

الرجاء المحاولة مرة أخرى أو التواصل مع المدير.
    `);
    }
});

// Handle errors
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Telegram Bot...');
    bot.stopPolling();
    pool.end();
    process.exit(0);
});

console.log('✅ Telegram Bot is ready with HYBRID SECURITY SYSTEM!');
console.log('🔒 Security Levels:');
console.log('  1. Whitelist (Trusted Users)');
console.log('  2. Invite Codes (24h validity)');
console.log('  3. Admin Approval (Manual)');
console.log('\nSend /start to the bot to begin');
