import TelegramBot from 'node-telegram-bot-api';
import pool from '../db.js';
import { telegramSecurityService } from './telegram-security-service.js';

interface LocationUpdate {
    telegram_user_id: number;
    latitude: number;
    longitude: number;
    timestamp: Date;
}

class TelegramBotService {
    private bot: TelegramBot | null = null;
    private isInitialized = false;

    // Translations
    private translations = {
        ar: {
            unauthorized: '⚠️ *غير مصرح لك باستخدام هذا البوت*',
            welcome: (userName: string) => `مرحباً ${userName}! للوصول إلى نظام تتبع الشاحنات، لديك خياران:`,
            hasInviteCode: '1️⃣ *إذا كان لديك كود دعوة:*',
            sendRegister: 'أرسل: `/register <الكود>`',
            registerExample: 'مثال: `/register ABC12345`',
            requestApproval: '2️⃣ *طلب موافقة المدير:*',
            sendRequest: 'أرسل: `/request <السبب>`',
            requestExample: 'مثال: `/request أنا سائق جديد`',
            yourUserId: (userId: number) => `*معرف المستخدم الخاص بك:* \`${userId}\``,
            giveToManager: '_قم بإعطاء هذا الرقم للمدير إذا طلب منك_',
            welcomeAuthorized: '🚛 *مرحباً بك في نظام تتبع الشاحنات*',
            botDescription: 'أنا بوت تتبع الشاحنات. يمكنني مساعدتك في:',
            sendLocation: '📍 *إرسال موقعك الحالي*',
            pressAttachment: '- اضغط على زر 📎 (المرفقات)',
            chooseLocation: '- اختر "الموقع" أو "Location"',
            sendCurrentLocation: '- أرسل موقعك الحالي',
            shareLiveLocation: '🔴 *مشاركة الموقع المباشر*',
            chooseLiveLocation: '- اختر "مشاركة الموقع المباشر"',
            selectDuration: '- حدد المدة (15 دقيقة، ساعة، 8 ساعات)',
            availableCommands: '*الأوامر المتاحة:*',
            trackCommand: '/track - بدء التتبع',
            stopCommand: '/stop - إيقاف التتبع',
            statusCommand: '/status - عرض حالة التتبع',
            helpCommand: '/help - عرض المساعدة',
            languageCommand: '/language - تغيير اللغة',
            notLinked: '⚠️ *لم يتم ربط حسابك بشاحنة*',
            linkingSteps: '📋 *خطوات الربط:*',
            copyId: '1️⃣ انسخ المعرف أعلاه',
            giveToManagerStep: '2️⃣ أعطه للمدير',
            managerWillLink: '3️⃣ سيقوم المدير بربط حسابك بالشاحنة',
            sendStartAgain: '4️⃣ بعد الربط، أرسل /start مرة أخرى',
            noteCanCopy: '💡 *ملاحظة:* يمكنك نسخ المعرف بالضغط عليه',
            trackingStarted: '✅ *تم بدء التتبع*',
            truck: (plateNumber: string) => `🚛 الشاحنة: ${plateNumber}`,
            pleaseSendLocation: '📍 يرجى إرسال موقعك:',
            pressAttachmentShort: '1. اضغط على زر 📎',
            chooseLocationShort: '2. اختر "الموقع"',
            sendOrShare: '3. أرسل موقعك الحالي أو شارك الموقع المباشر',
            trackingStopped: '⏸️ *تم إيقاف التتبع*',
            canStartAgain: 'يمكنك بدء التتبع مرة أخرى باستخدام /track',
            notRegistered: '⚠️ *غير مسجل*',
            giveNumberToManager: 'يرجى إعطاء هذا الرقم للمدير',
            trackingStatus: '📊 *حالة التتبع*',
            driver: (name: string) => `👤 *السائق:* ${name}`,
            lastUpdate: (time: string) => `📍 *آخر تحديث:* ${time}`,
            noUpdate: 'لا يوجد',
            statusLabel: '🔋 *الحالة:*',
            enRoute: '🚚 في الطريق',
            arrived: '✅ وصلت',
            waiting: '⏸️ في الانتظار',
            help: '📚 *المساعدة*',
            howToSendLocation: '*كيفية إرسال الموقع:*',
            howToShareLive: '*مشاركة الموقع المباشر:*',
            commands: '*الأوامر:*',
            startCommand: '/start - البدء',
            locationUpdated: '✅ *تم تحديث الموقع*',
            errorUpdatingLocation: '❌ حدث خطأ أثناء تحديث الموقع. يرجى المحاولة مرة أخرى.',
            languageSelection: '🌐 *اختر اللغة / Choose Language*',
            currentLanguage: (lang: string) => `اللغة الحالية: ${lang === 'ar' ? 'العربية 🇪🇬' : 'Français 🇫🇷'}`,
            selectLanguage: 'اختر اللغة:',
            arabic: '🇪🇬 العربية',
            french: '🇫🇷 Français',
            languageChanged: (lang: string) => `✅ تم تغيير اللغة إلى ${lang === 'ar' ? 'العربية' : 'الفرنسية'}`,
        },
        fr: {
            unauthorized: '⚠️ *Vous n\'êtes pas autorisé à utiliser ce bot*',
            welcome: (userName: string) => `Bonjour ${userName}! Pour accéder au système de suivi des camions, vous avez deux options:`,
            hasInviteCode: '1️⃣ *Si vous avez un code d\'invitation:*',
            sendRegister: 'Envoyez: `/register <code>`',
            registerExample: 'Exemple: `/register ABC12345`',
            requestApproval: '2️⃣ *Demander l\'approbation du gestionnaire:*',
            sendRequest: 'Envoyez: `/request <raison>`',
            requestExample: 'Exemple: `/request Je suis un nouveau chauffeur`',
            yourUserId: (userId: number) => `*Votre ID utilisateur:* \`${userId}\``,
            giveToManager: '_Donnez ce numéro au gestionnaire si demandé_',
            welcomeAuthorized: '🚛 *Bienvenue dans le système de suivi des camions*',
            botDescription: 'Je suis le bot de suivi des camions. Je peux vous aider à:',
            sendLocation: '📍 *Envoyer votre position actuelle*',
            pressAttachment: '- Appuyez sur le bouton 📎 (pièces jointes)',
            chooseLocation: '- Choisissez "Position" ou "Location"',
            sendCurrentLocation: '- Envoyez votre position actuelle',
            shareLiveLocation: '🔴 *Partager la position en direct*',
            chooseLiveLocation: '- Choisissez "Partager la position en direct"',
            selectDuration: '- Sélectionnez la durée (15 minutes, 1 heure, 8 heures)',
            availableCommands: '*Commandes disponibles:*',
            trackCommand: '/track - Démarrer le suivi',
            stopCommand: '/stop - Arrêter le suivi',
            statusCommand: '/status - Afficher le statut',
            helpCommand: '/help - Afficher l\'aide',
            languageCommand: '/language - Changer la langue',
            notLinked: '⚠️ *Votre compte n\'est pas lié à un camion*',
            linkingSteps: '📋 *Étapes de liaison:*',
            copyId: '1️⃣ Copiez l\'ID ci-dessus',
            giveToManagerStep: '2️⃣ Donnez-le au gestionnaire',
            managerWillLink: '3️⃣ Le gestionnaire liera votre compte au camion',
            sendStartAgain: '4️⃣ Après la liaison, envoyez /start à nouveau',
            noteCanCopy: '💡 *Note:* Vous pouvez copier l\'ID en appuyant dessus',
            trackingStarted: '✅ *Suivi démarré*',
            truck: (plateNumber: string) => `🚛 Camion: ${plateNumber}`,
            pleaseSendLocation: '📍 Veuillez envoyer votre position:',
            pressAttachmentShort: '1. Appuyez sur 📎',
            chooseLocationShort: '2. Choisissez "Position"',
            sendOrShare: '3. Envoyez votre position ou partagez en direct',
            trackingStopped: '⏸️ *Suivi arrêté*',
            canStartAgain: 'Vous pouvez redémarrer le suivi avec /track',
            notRegistered: '⚠️ *Non enregistré*',
            giveNumberToManager: 'Veuillez donner ce numéro au gestionnaire',
            trackingStatus: '📊 *Statut du suivi*',
            driver: (name: string) => `👤 *Chauffeur:* ${name}`,
            lastUpdate: (time: string) => `📍 *Dernière mise à jour:* ${time}`,
            noUpdate: 'Aucune',
            statusLabel: '🔋 *Statut:*',
            enRoute: '🚚 En route',
            arrived: '✅ Arrivé',
            waiting: '⏸️ En attente',
            help: '📚 *Aide*',
            howToSendLocation: '*Comment envoyer la position:*',
            howToShareLive: '*Partager la position en direct:*',
            commands: '*Commandes:*',
            startCommand: '/start - Démarrer',
            locationUpdated: '✅ *Position mise à jour*',
            errorUpdatingLocation: '❌ Erreur lors de la mise à jour de la position. Veuillez réessayer.',
            languageSelection: '🌐 *اختر اللغة / Choose Language*',
            currentLanguage: (lang: string) => `Langue actuelle: ${lang === 'ar' ? 'العربية 🇪🇬' : 'Français 🇫🇷'}`,
            selectLanguage: 'Choisissez la langue:',
            arabic: '🇪🇬 العربية',
            french: '🇫🇷 Français',
            languageChanged: (lang: string) => `✅ Langue changée en ${lang === 'ar' ? 'arabe' : 'français'}`,
        }
    };

    constructor() {
        this.initialize();
    }

    private async initialize() {
        const token = process.env.TELEGRAM_BOT_TOKEN;

        if (!token) {
            console.warn('⚠️ TELEGRAM_BOT_TOKEN not found in environment variables');
            console.warn('⚠️ Telegram bot service will not be available');
            return;
        }

        try {
            // Create bot instance with polling enabled for local development
            this.bot = new TelegramBot(token, {
                polling: true,  // Enable polling for local development
                filepath: false  // Disable file downloads
            });

            // Delete any existing webhook to avoid conflicts
            await this.bot.deleteWebHook();
            console.log('✅ Webhook deleted (using polling mode)');

            this.isInitialized = true;
            console.log('✅ Telegram bot service initialized (Polling mode)');

            // Set up message handlers
            this.setupHandlers();
        } catch (error) {
            console.error('❌ Failed to initialize Telegram bot:', error);
        }
    }

    /**
     * Setup message handlers
     */
    private setupHandlers() {
        if (!this.bot) return;

        // Handle all messages
        this.bot.on('message', async (msg) => {
            await this.processUpdate({ message: msg });
        });

        console.log('✅ Telegram bot handlers registered');
    }

    /**
     * Set webhook URL for receiving updates
     */
    async setWebhook(webhookUrl: string): Promise<boolean> {
        if (!this.bot) {
            console.error('❌ Bot not initialized');
            return false;
        }

        try {
            await this.bot.setWebHook(webhookUrl);
            console.log(`✅ Webhook set to: ${webhookUrl}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to set webhook:', error);
            return false;
        }
    }

    /**
     * Process incoming update from Telegram
     */
    async processUpdate(update: any): Promise<void> {
        if (!this.bot) {
            console.error('❌ Bot not initialized');
            return;
        }

        try {
            const message = update.message;

            if (!message) {
                return;
            }

            const chatId = message.chat.id;
            const userId = message.from.id;

            // Handle location messages
            if (message.location) {
                await this.handleLocation(userId, chatId, message.location);
                return;
            }

            // Handle commands
            if (message.text) {
                const command = message.text.toLowerCase();
                const userName = message.from.first_name || message.from.username || 'User';

                if (command.startsWith('/start')) {
                    await this.handleStart(chatId, userId, userName);
                } else if (command.startsWith('/register')) {
                    await this.handleRegister(chatId, userId, message.text, userName);
                } else if (command.startsWith('/request')) {
                    await this.handleRequest(chatId, userId, message.text, userName);
                } else if (command.startsWith('/track')) {
                    await this.handleTrack(chatId, userId);
                } else if (command.startsWith('/stop')) {
                    await this.handleStop(chatId, userId);
                } else if (command.startsWith('/status')) {
                    await this.handleStatus(chatId, userId);
                } else if (command.startsWith('/help')) {
                    await this.handleHelp(chatId, userId);
                } else if (command.startsWith('/language')) {
                    await this.handleLanguage(chatId, userId, message.text);
                }
            }
        } catch (error) {
            console.error('❌ Error processing update:', error);
        }
    }

    /**
     * Handle /start command
     */
    private async handleStart(chatId: number, userId: number, userName: string): Promise<void> {
        // Check if user has access
        const hasAccess = await telegramSecurityService.hasAccess(userId.toString());

        if (!hasAccess) {
            // User doesn't have access - show registration options
            const unauthorizedMessage = `
⚠️ *غير مصرح لك باستخدام هذا البوت*

مرحباً ${userName}! للوصول إلى نظام تتبع الشاحنات، لديك خياران:

1️⃣ *إذا كان لديك كود دعوة:*
   أرسل: \`/register <الكود>\`
   مثال: \`/register ABC12345\`

2️⃣ *طلب موافقة المدير:*
   أرسل: \`/request <السبب>\`
   مثال: \`/request أنا سائق جديد\`

*معرف المستخدم الخاص بك:* \`${userId}\`
_قم بإعطاء هذا الرقم للمدير إذا طلب منك_
            `.trim();

            await this.sendMessage(chatId, unauthorizedMessage, { parse_mode: 'Markdown' });
            return;
        }

        // User has access - show normal welcome message
        const message = `
🚛 *مرحباً بك في نظام تتبع الشاحنات*

أنا بوت تتبع الشاحنات. يمكنني مساعدتك في:

📍 *إرسال موقعك الحالي*
- اضغط على زر 📎 (المرفقات)
- اختر "الموقع" أو "Location"
- أرسل موقعك الحالي

🔴 *مشاركة الموقع المباشر*
- اضغط على زر 📎 (المرفقات)
- اختر "الموقع" أو "Location"
- اختر "مشاركة الموقع المباشر"
- حدد المدة (15 دقيقة، ساعة، 8 ساعات)

*الأوامر المتاحة:*
/track - بدء التتبع
/stop - إيقاف التتبع
/status - عرض حالة التتبع
/help - عرض المساعدة

*معرف المستخدم الخاص بك:* \`${userId}\`
_قم بإعطاء هذا الرقم للمدير لربط حسابك بالشاحنة_
    `.trim();

        await this.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }

    /**
     * Handle /track command
     */
    private async handleTrack(chatId: number, userId: number): Promise<void> {
        // Check if user is registered
        const truck = await this.getTruckByTelegramId(userId);

        if (!truck) {
            await this.sendMessage(
                chatId,
                `⚠️ *لم يتم ربط حسابك بشاحنة*

*معرف المستخدم الخاص بك:*
\`${userId}\`

📋 *خطوات الربط:*
1️⃣ انسخ المعرف أعلاه
2️⃣ أعطه للمدير
3️⃣ سيقوم المدير بربط حسابك بالشاحنة
4️⃣ بعد الربط، أرسل /start مرة أخرى

💡 *ملاحظة:* يمكنك نسخ المعرف بالضغط عليه`,
                { parse_mode: 'Markdown' }
            );
            return;
        }

        await this.sendMessage(
            chatId,
            `✅ *تم بدء التتبع*\n\n🚛 الشاحنة: ${truck.plate_number}\n\n📍 يرجى إرسال موقعك:\n1. اضغط على زر 📎\n2. اختر "الموقع"\n3. أرسل موقعك الحالي أو شارك الموقع المباشر`,
            { parse_mode: 'Markdown' }
        );
    }

    /**
     * Handle /stop command
     */
    private async handleStop(chatId: number, userId: number): Promise<void> {
        await this.sendMessage(
            chatId,
            '⏸️ *تم إيقاف التتبع*\n\nيمكنك بدء التتبع مرة أخرى باستخدام /track',
            { parse_mode: 'Markdown' }
        );
    }

    /**
     * Handle /status command
     */
    private async handleStatus(chatId: number, userId: number): Promise<void> {
        const truck = await this.getTruckByTelegramId(userId);

        if (!truck) {
            await this.sendMessage(
                chatId,
                '⚠️ *غير مسجل*\n\nمعرف المستخدم: `' + userId + '`\n\nيرجى إعطاء هذا الرقم للمدير',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        const lastUpdate = truck.last_update ? new Date(truck.last_update).toLocaleString('ar-SA') : 'لا يوجد';

        const message = `
📊 *حالة التتبع*

🚛 *الشاحنة:* ${truck.plate_number}
👤 *السائق:* ${truck.driver_name}
📍 *آخر تحديث:* ${lastUpdate}
🔋 *الحالة:* ${truck.status === 'en_route' ? '🚚 في الطريق' : truck.status === 'arrived' ? '✅ وصلت' : '⏸️ في الانتظار'}
    `.trim();

        await this.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }

    /**
     * Handle /help command
     */
    private async handleHelp(chatId: number, userId: number): Promise<void> {
        const message = `
📚 *المساعدة*

*كيفية إرسال الموقع:*
1. اضغط على زر 📎 (المرفقات)
2. اختر "الموقع" أو "Location"
3. أرسل موقعك الحالي

*مشاركة الموقع المباشر:*
1. اضغط على زر 📎
2. اختر "الموقع"
3. اختر "مشاركة الموقع المباشر"
4. حدد المدة

*الأوامر:*
/start - البدء
/track - بدء التتبع
/stop - إيقاف التتبع
/status - عرض الحالة
/help - المساعدة
    `.trim();

        await this.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }

    /**
     * Get user's preferred language
     */
    private async getUserLanguage(userId: number): Promise<'ar' | 'fr'> {
        try {
            const result = await pool.query(
                'SELECT preferred_language FROM telegram_user_preferences WHERE telegram_user_id = $1',
                [userId.toString()]
            );
            return (result.rows[0]?.preferred_language || 'ar') as 'ar' | 'fr';
        } catch (error) {
            console.error('Error getting user language:', error);
            return 'ar'; // Default to Arabic
        }
    }

    /**
     * Set user's preferred language
     */
    private async setUserLanguage(userId: number, language: 'ar' | 'fr'): Promise<void> {
        try {
            await pool.query(
                `INSERT INTO telegram_user_preferences (telegram_user_id, preferred_language, updated_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (telegram_user_id)
                 DO UPDATE SET preferred_language = $2, updated_at = NOW()`,
                [userId.toString(), language]
            );
        } catch (error) {
            console.error('Error setting user language:', error);
        }
    }

    /**
     * Get translation for user
     */
    private async t(userId: number): Promise<typeof this.translations.ar> {
        const lang = await this.getUserLanguage(userId);
        return this.translations[lang];
    }

    /**
     * Handle /language command
     */
    private async handleLanguage(chatId: number, userId: number, text: string): Promise<void> {
        const currentLang = await this.getUserLanguage(userId);

        // Check if user is selecting a language
        const parts = text.trim().split(' ');

        if (parts.length > 1) {
            const selectedLang = parts[1].toLowerCase();

            if (selectedLang === 'ar') {
                await this.setUserLanguage(userId, 'ar');
                await this.sendMessage(chatId, this.translations.ar.languageChanged('ar'), { parse_mode: 'Markdown' });
                return;
            } else if (selectedLang === 'fr') {
                await this.setUserLanguage(userId, 'fr');
                await this.sendMessage(chatId, this.translations.fr.languageChanged('fr'), { parse_mode: 'Markdown' });
                return;
            }
        }

        // Show language selection menu
        const t = this.translations[currentLang];
        const message = `
${t.languageSelection}

${t.currentLanguage(currentLang)}

${t.selectLanguage}

/language ar - ${this.translations.ar.arabic}
/language fr - ${this.translations.fr.french}
        `.trim();

        await this.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }

    /**
     * Handle location message
     */
    private async handleLocation(
        userId: number,
        chatId: number,
        location: { latitude: number; longitude: number }
    ): Promise<void> {
        try {
            // Get truck associated with this Telegram user
            const truck = await this.getTruckByTelegramId(userId);

            if (!truck) {
                await this.sendMessage(
                    chatId,
                    '⚠️ *لم يتم ربط حسابك بشاحنة*\n\nمعرف المستخدم: `' + userId + '`\n\nيرجى إعطاء هذا الرقم للمدير',
                    { parse_mode: 'Markdown' }
                );
                return;
            }

            // Update truck location
            await this.updateTruckLocation({
                telegram_user_id: userId,
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: new Date(),
            });

            // Send confirmation
            await this.sendMessage(
                chatId,
                `✅ *تم تحديث الموقع*\n\n🚛 ${truck.plate_number}\n📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
                { parse_mode: 'Markdown' }
            );

            console.log(`📍 Location updated for truck ${truck.plate_number} via Telegram`);
        } catch (error) {
            console.error('❌ Error handling location:', error);
            await this.sendMessage(
                chatId,
                '❌ حدث خطأ أثناء تحديث الموقع. يرجى المحاولة مرة أخرى.'
            );
        }
    }

    /**
     * Get truck by Telegram user ID
     */
    private async getTruckByTelegramId(telegramUserId: number): Promise<any> {
        try {
            const result = await pool.query(
                'SELECT * FROM trucks WHERE telegram_user_id = $1 LIMIT 1',
                [telegramUserId.toString()]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ Error getting truck by Telegram ID:', error);
            return null;
        }
    }

    /**
     * Update truck location from Telegram
     */
    private async updateTruckLocation(data: LocationUpdate): Promise<void> {
        try {
            // First, get current location to calculate speed
            const currentTruck = await pool.query(
                'SELECT latitude, longitude, updated_at, speed FROM trucks WHERE telegram_user_id = $1',
                [data.telegram_user_id.toString()]
            );

            let speed = 0;
            if (currentTruck.rows.length > 0 && currentTruck.rows[0].latitude && currentTruck.rows[0].longitude) {
                const prev = currentTruck.rows[0];
                const timeDiff = (data.timestamp.getTime() - new Date(prev.updated_at).getTime()) / 1000; // seconds

                // Only calculate speed if enough time has passed (at least 5 seconds)
                // This prevents unrealistic speed calculations from GPS jitter
                if (timeDiff >= 5) {
                    // Calculate distance using Haversine formula
                    const R = 6371; // Earth radius in km
                    const dLat = (data.latitude - prev.latitude) * Math.PI / 180;
                    const dLon = (data.longitude - prev.longitude) * Math.PI / 180;
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(prev.latitude * Math.PI / 180) * Math.cos(data.latitude * Math.PI / 180) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const distance = R * c; // km

                    const calculatedSpeed = Math.round((distance / timeDiff) * 3600); // km/h

                    // Cap speed at 200 km/h to filter out GPS errors
                    // Trucks typically don't exceed 120 km/h
                    speed = Math.min(calculatedSpeed, 200);
                } else {
                    // Keep previous speed if time difference is too small
                    speed = prev.speed || 0;
                }
            }
            // Update truck location and status
            await pool.query(
                `UPDATE trucks 
         SET latitude = $1, 
             longitude = $2, 
             tracking_method = 'telegram',
             status = 'in_transit',
             speed = $4,
             updated_at = NOW()
         WHERE telegram_user_id = $3`,
                [data.latitude, data.longitude, data.telegram_user_id.toString(), speed]
            );

            console.log(`📍 Location updated: ${data.latitude}, ${data.longitude}, Speed: ${speed} km/h`);
        } catch (error) {
            console.error('❌ Error updating truck location:', error);
            throw error;
        }
    }

    /**
     * Send message to user
     */
    public async sendMessage(
        chatId: number,
        text: string,
        options?: any
    ): Promise<void> {
        if (!this.bot) {
            console.error('❌ Bot not initialized');
            return;
        }

        try {
            await this.bot.sendMessage(chatId, text, options);
        } catch (error) {
            console.error('❌ Error sending message:', error);
        }
    }

    /**
     * Send location to user
     */
    async sendLocation(
        chatId: number,
        latitude: number,
        longitude: number
    ): Promise<void> {
        if (!this.bot) {
            console.error('❌ Bot not initialized');
            return;
        }

        try {
            await this.bot.sendLocation(chatId, latitude, longitude);
        } catch (error) {
            console.error('❌ Error sending location:', error);
        }
    }

    /**
     * Check if bot is initialized
     */
    isReady(): boolean {
        return this.isInitialized && this.bot !== null;
    }

    /**
     * Handle /register command
     */
    private async handleRegister(chatId: number, userId: number, text: string, userName: string): Promise<void> {
        const parts = text.split(' ');

        if (parts.length < 2) {
            await this.sendMessage(
                chatId,
                '⚠️ *استخدام خاطئ*\\n\\nالاستخدام الصحيح:\\n`/register <كود الدعوة>`\\n\\nمثال:\\n`/register ABC12345`',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        const code = parts[1].toUpperCase();

        await this.sendMessage(chatId, '⏳ جاري التحقق من الكود...');

        const result = await telegramSecurityService.validateInvitationCode(code, userId.toString());

        if (!result.valid) {
            await this.sendMessage(
                chatId,
                `❌ *${result.message || 'كود غير صالح'}*\\n\\nتأكد من:\\n- الكود صحيح\\n- لم يتم استخدامه من قبل\\n- لم تنتهِ صلاحيته`,
                { parse_mode: 'Markdown' }
            );
            return;
        }

        // Link user to truck
        if (result.truckId) {
            await pool.query(
                'UPDATE trucks SET telegram_user_id = $1 WHERE id = $2',
                [userId.toString(), result.truckId]
            );
        }

        const message = `
✅ *تم التسجيل بنجاح!*

🎉 مرحباً ${userName}!

تم ربط حسابك بالنظام. يمكنك الآن:

📍 إرسال موقعك
🔴 مشاركة الموقع المباشر
📊 عرض حالة الشاحنة

*الأوامر المتاحة:*
/track - بدء التتبع
/status - عرض الحالة
/help - المساعدة
        `.trim();

        await this.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        console.log(`✅ User ${userId} registered successfully with code ${code}`);
    }

    /**
     * Handle /request command
     */
    private async handleRequest(chatId: number, userId: number, text: string, userName: string): Promise<void> {
        const parts = text.split(' ');

        if (parts.length < 2) {
            await this.sendMessage(
                chatId,
                '⚠️ *استخدام خاطئ*\\n\\nالاستخدام الصحيح:\\n`/request <سبب الطلب>`\\n\\nمثال:\\n`/request أنا سائق جديد وأحتاج للوصول`',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        const requestMessage = parts.slice(1).join(' ');

        await this.sendMessage(chatId, '⏳ جاري إرسال الطلب...');

        const success = await telegramSecurityService.requestAccess(
            userId.toString(),
            userName,
            requestMessage
        );

        if (success) {
            const message = `
✅ *تم إرسال طلبك بنجاح!*

سيتم مراجعة طلبك من قبل المدير قريباً.

📝 *معلومات الطلب:*
👤 الاسم: ${userName}
🆔 المعرف: \`${userId}\`
💬 السبب: ${requestMessage}

⏳ *يرجى الانتظار...*
سنخطرك عند الموافقة على طلبك.
            `.trim();

            await this.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            console.log(`✅ Access request from ${userName} (${userId})`);
        } else {
            await this.sendMessage(
                chatId,
                '❌ حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.'
            );
        }
    }
}

// Export singleton instance
export const telegramBotService = new TelegramBotService();
