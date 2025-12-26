# دليل سريع لتفعيل نظام تفضيلات اللغة 🚀

## الخطوة 1: تشغيل SQL Migrations ✅

### للمستخدمين المسجلين:
```bash
# تشغيل migration لإضافة عمود اللغة في جدول users
psql -h YOUR_NEON_HOST -U YOUR_USER -d YOUR_DATABASE -f server/migrations/add_language_preference.sql
```

### للزوار (Guests):
```bash
# تشغيل migration لإنشاء جدول guest_preferences
psql -h YOUR_NEON_HOST -U YOUR_USER -d YOUR_DATABASE -f server/migrations/add_guest_preferences.sql
```

**أو استخدم أداة إدارة قاعدة البيانات:**
- افتح Neon Console
- اذهب إلى SQL Editor
- انسخ محتوى الملفات وشغّلها

---

## الخطوة 2: إضافة API Endpoints في Backend 🔌

أضف الـ 4 endpoints التالية في ملف الـ server الخاص بك:

### 1. GET /api/user/language
```javascript
app.get('/api/user/language', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT preferred_language FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ language: result.rows[0].preferred_language || 'ar' });
  } catch (error) {
    console.error('Error fetching language:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 2. PATCH /api/user/language
```javascript
app.patch('/api/user/language', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { language } = req.body;
    
    if (language !== 'ar' && language !== 'fr') {
      return res.status(400).json({ error: 'Invalid language' });
    }
    
    await pool.query(
      'UPDATE users SET preferred_language = $1 WHERE id = $2',
      [language, userId]
    );
    
    res.json({ success: true, language });
  } catch (error) {
    console.error('Error saving language:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 3. GET /api/guest/language
```javascript
app.get('/api/guest/language', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    const result = await pool.query(
      'SELECT preferred_language FROM guest_preferences WHERE session_id = $1',
      [sessionId]
    );
    
    if (result.rows.length === 0) {
      await pool.query(
        'INSERT INTO guest_preferences (session_id, preferred_language) VALUES ($1, $2)',
        [sessionId, 'ar']
      );
      return res.json({ language: 'ar' });
    }
    
    await pool.query(
      'UPDATE guest_preferences SET last_accessed = NOW() WHERE session_id = $1',
      [sessionId]
    );
    
    res.json({ language: result.rows[0].preferred_language || 'ar' });
  } catch (error) {
    console.error('Error fetching guest language:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 4. PATCH /api/guest/language
```javascript
app.patch('/api/guest/language', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const { language } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    if (language !== 'ar' && language !== 'fr') {
      return res.status(400).json({ error: 'Invalid language' });
    }
    
    await pool.query(
      `INSERT INTO guest_preferences (session_id, preferred_language, updated_at, last_accessed)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (session_id) 
       DO UPDATE SET preferred_language = $2, updated_at = NOW(), last_accessed = NOW()`,
      [sessionId, language]
    );
    
    res.json({ success: true, language });
  } catch (error) {
    console.error('Error saving guest language:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## الخطوة 3: اختبار النظام ✅

### اختبار الزوار:
```bash
# 1. افتح التطبيق بدون تسجيل دخول
# 2. افتح Developer Tools > Application > Cookies
# 3. تحقق من وجود guest_session_id
# 4. بدّل اللغة للفرنسية
# 5. افتح Network tab وتحقق من PATCH /api/guest/language
# 6. أعد تحميل الصفحة - يجب أن تظل الفرنسية
```

### اختبار المسجلين:
```bash
# 1. سجل الدخول
# 2. بدّل اللغة للفرنسية
# 3. افتح Network tab وتحقق من PATCH /api/user/language
# 4. سجل الدخول من جهاز آخر - يجب أن تكون الفرنسية
```

---

## الخطوة 4: تنظيف الجلسات القديمة (اختياري) 🧹

### يدوياً:
```sql
SELECT cleanup_old_guest_sessions();
```

### تلقائياً (مع pg_cron):
```sql
-- تثبيت pg_cron extension أولاً
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- جدولة التنظيف يومياً في الساعة 2 صباحاً
SELECT cron.schedule('cleanup-guest-sessions', '0 2 * * *', 'SELECT cleanup_old_guest_sessions()');
```

---

## ✅ جاهز!

النظام الآن يعمل بالكامل:
- ✅ المسجلون: حفظ في NeonDB + مزامنة
- ✅ الزوار: حفظ في NeonDB + session
- ✅ تبديل فوري بين العربية والفرنسية
- ✅ RTL/LTR تلقائي

**استمتع بالنظام الجديد!** 🎉
