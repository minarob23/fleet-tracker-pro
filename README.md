# 🚛 Fleet Tracker Pro - نظام تتبع الشاحنات

نظام متكامل لتتبع الشاحنات عبر GPS مع دعم متعدد المنصات (Telegram, WhatsApp, Phone App).

---

## ✨ المزايا الرئيسية

### 📍 تتبع GPS متعدد المنصات
- 🤖 **Telegram Bot** - مجاني وموثوق (✅ مكتمل)
- 💬 **WhatsApp Bot** - شائع وسهل الاستخدام (📝 دليل متوفر)
- 📱 **Phone App** - احترافي ومستمر (📝 دليل متوفر)
- 🌐 **Web App** - تطبيق ويب للسائقين

### 🗺️ خريطة تفاعلية
- عرض جميع الشاحنات في الوقت الفعلي
- تتبع المسارات التاريخية
- Geofencing للمدن
- وضع ليلي/نهاري

### 👥 إدارة المستخدمين
- أدوار متعددة (Admin, Central Office, City Staff, Supplier)
- مصادقة آمنة (JWT)
- أذونات مخصصة

### 📊 التقارير والتحليلات
- تقارير الوصول
- إحصائيات الشاحنات
- تحليلات السرعة
- تصدير Excel/PDF

### 🌍 دعم متعدد اللغات
- العربية (RTL)
- الفرنسية

---

## 🚀 البدء السريع

### المتطلبات

- Node.js 18+
- PostgreSQL (Neon)
- npm أو yarn

### التثبيت

```bash
# استنساخ المشروع
git clone <repository-url>
cd fleet-tracker-pro-main

# تثبيت المكتبات
npm install

# إعداد قاعدة البيانات
# 1. أنشئ قاعدة بيانات في Neon
# 2. نفذ migrations من server/migrations/

# إعداد المتغيرات البيئية
cp server/.env.example server/.env
# عدّل server/.env بمعلوماتك

# تشغيل التطبيق
npm run dev:all
```

---

## 📱 إعداد Telegram Bot

### الخطوة 1: إنشاء البوت

1. افتح Telegram → ابحث عن `@BotFather`
2. أرسل `/newbot`
3. اتبع التعليمات
4. احتفظ بالـ Token

### الخطوة 2: التكوين

```env
# server/.env
TELEGRAM_BOT_TOKEN=your-bot-token-here
```

### الخطوة 3: Migration

```sql
-- نفذ في Neon Dashboard
-- server/migrations/004_add_telegram_support.sql
```

### الخطوة 4: الاستخدام

1. السائق يرسل `/start` للبوت
2. يحصل على معرف المستخدم
3. المدير يضيف المعرف عند إضافة الشاحنة
4. السائق يشارك موقعه
5. التتبع يبدأ تلقائياً!

📚 **دليل كامل:** `complete_gps_tracking_guide.md`

---

## 🏗️ البنية التقنية

### Frontend
- **React** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI Components
- **Mapbox GL** - Maps
- **Recharts** - Charts
- **React Query** - Data fetching

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **PostgreSQL** (Neon)
- **JWT** - Authentication
- **Telegram Bot API**
- **WebSocket** - Real-time updates

---

## 📂 هيكل المشروع

```
fleet-tracker-pro/
├── src/                      # Frontend
│   ├── components/          # React components
│   │   ├── dashboard/      # Dashboard components
│   │   └── ui/             # UI components (shadcn)
│   ├── hooks/              # Custom hooks
│   ├── contexts/           # React contexts
│   ├── types/              # TypeScript types
│   ├── utils/              # Utility functions
│   └── i18n/               # Translations
│
├── server/                  # Backend
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   │   ├── telegram-bot-service.ts
│   │   ├── whatsapp-service.ts
│   │   └── auth-service.ts
│   ├── middleware/         # Express middleware
│   ├── migrations/         # Database migrations
│   └── index.ts            # Server entry point
│
└── docs/                   # Documentation
    ├── telegram_quick_start.md
    ├── telegram_bot_setup_guide.md
    └── complete_gps_tracking_guide.md
```

---

## 🔐 الأمان

- JWT authentication
- Password hashing (bcrypt)
- Role-based access control
- SQL injection protection
- XSS protection
- CORS configuration

---

## 🌐 API Endpoints

### Authentication
```
POST /api/auth/login       # تسجيل الدخول
POST /api/auth/verify      # التحقق من الجلسة
```

### Trucks
```
GET    /api/trucks         # جلب جميع الشاحنات
POST   /api/trucks         # إضافة شاحنة
PATCH  /api/trucks/:id     # تحديث شاحنة
DELETE /api/trucks/:id     # حذف شاحنة
POST   /api/trucks/:id/arrived  # تحديد وصول
```

### GPS
```
POST /api/gps/webhook      # GPS webhook
POST /api/gps/update       # تحديث الموقع
```

### Telegram
```
POST /api/telegram/webhook      # Telegram webhook
POST /api/telegram/set-webhook  # إعداد webhook
GET  /api/telegram/health       # فحص الصحة
```

---

## 🎨 الواجهة

### الصفحات الرئيسية

1. **Login** - صفحة تسجيل الدخول
2. **Dashboard** - لوحة التحكم الرئيسية
   - الخريطة التفاعلية
   - قائمة الشاحنات
   - الإحصائيات
   - التحليلات
3. **Reports** - التقارير
4. **Driver App** - تطبيق السائق

### المكونات الرئيسية

- `TruckMap` - خريطة الشاحنات
- `TruckList` - قائمة الشاحنات
- `AddTruckForm` - نموذج إضافة شاحنة
- `AnalyticsDashboard` - لوحة التحليلات
- `ArrivalQueue` - قائمة الانتظار

---

## 🔧 التطوير

### Scripts

```bash
# تشغيل التطبيق (Frontend + Backend)
npm run dev:all

# Frontend فقط
npm run dev

# Backend فقط
npm run dev:backend

# Build للإنتاج
npm run build

# Linting
npm run lint
```

### Environment Variables

```env
# Database
NEON_DATABASE_URL=postgresql://...

# Server
PORT=3001
NODE_ENV=development

# Authentication
JWT_SECRET=your-secret-key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token

# WhatsApp (Optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
```

---

## 📖 التوثيق

### أدلة المستخدم

1. **دليل البدء السريع**
   - `telegram_quick_start.md`
   - إعداد سريع في 5 دقائق

2. **دليل الإعداد الشامل**
   - `telegram_bot_setup_guide.md`
   - تعليمات مفصلة خطوة بخطوة

3. **دليل GPS الكامل**
   - `complete_gps_tracking_guide.md`
   - جميع طرق التتبع الثلاث

### أدلة المطورين

- API Documentation
- Database Schema
- Component Documentation

---

## 🐛 استكشاف الأخطاء

### Telegram Bot لا يرد

```bash
# تحقق من logs
npm run dev:all

# يجب أن ترى:
✅ Telegram bot service initialized
🤖 Telegram Webhook: /api/telegram/webhook
```

### قاعدة البيانات

```sql
-- تحقق من الاتصال
SELECT NOW();

-- تحقق من الجداول
\dt

-- تحقق من بيانات Telegram
SELECT plate_number, telegram_user_id, tracking_method 
FROM trucks 
WHERE telegram_user_id IS NOT NULL;
```

---

## 🤝 المساهمة

نرحب بالمساهمات! يرجى:

1. Fork المشروع
2. إنشاء branch للميزة
3. Commit التغييرات
4. Push إلى Branch
5. فتح Pull Request

---

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License.

---

## 👥 الفريق

- **المطور الرئيسي:** [Your Name]
- **المساهمون:** [Contributors]

---

## 📞 الدعم

- 📧 Email: support@example.com
- 💬 Telegram: @support_bot
- 🌐 Website: https://example.com

---

## 🎉 شكر خاص

- shadcn/ui لمكونات UI الرائعة
- Mapbox لخدمة الخرائط
- Neon لقاعدة البيانات
- Telegram لـ Bot API المجاني

---

## 🗺️ خارطة الطريق

### ✅ المكتمل
- [x] تتبع GPS الأساسي
- [x] Telegram Bot
- [x] لوحة التحكم
- [x] التقارير
- [x] دعم متعدد اللغات

### 🚧 قيد التطوير
- [ ] WhatsApp Bot
- [ ] Phone App
- [ ] إشعارات Push
- [ ] تحليلات متقدمة

### 📋 المخطط
- [ ] تطبيق موبايل (React Native)
- [ ] AI للتنبؤ بالوصول
- [ ] تكامل مع أنظمة ERP
- [ ] API عامة

---

**🚀 ابدأ الآن واستمتع بتتبع شاحناتك بسهولة!**
