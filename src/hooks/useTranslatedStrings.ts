// Helper file with commonly used translated strings
import { useLanguage } from '@/contexts/LanguageContext';

export const useTranslatedStrings = () => {
    const { t, language } = useLanguage();

    return {
        // Status translations
        statusLabels: {
            waiting: language === 'ar' ? '⏸️ في الانتظار' : '⏸️ En attente',
            en_route: language === 'ar' ? '🚚 في الطريق' : '🚚 En route',
            arrived: language === 'ar' ? '✅ وصلت' : '✅ Arrivé',
            depot: language === 'ar' ? '🏪 المخزن' : '🏪 Dépôt',
            discharged: language === 'ar' ? '📦 منزلة' : '📦 Déchargé',
        },

        // Database status
        dbStatus: {
            connected: language === 'ar' ? 'متصل' : 'Connecté',
            connecting: language === 'ar' ? 'جاري الاتصال...' : 'Connexion...',
            disconnected: language === 'ar' ? 'غير متصل' : 'Déconnecté',
        },

        // Common actions
        actions: {
            save: language === 'ar' ? 'حفظ' : 'Enregistrer',
            cancel: language === 'ar' ? 'إلغاء' : 'Annuler',
            delete: language === 'ar' ? 'حذف' : 'Supprimer',
            edit: language === 'ar' ? 'تعديل' : 'Modifier',
            add: language === 'ar' ? 'إضافة' : 'Ajouter',
            refresh: language === 'ar' ? 'تحديث' : 'Actualiser',
            export: language === 'ar' ? 'تصدير' : 'Exporter',
            print: language === 'ar' ? 'طباعة' : 'Imprimer',
        },

        // Time units
        timeUnits: {
            seconds: language === 'ar' ? 'ثانية' : 'secondes',
            minutes: language === 'ar' ? 'دقيقة' : 'minutes',
            hours: language === 'ar' ? 'ساعة' : 'heures',
            days: language === 'ar' ? 'يوم' : 'jours',
            ago: language === 'ar' ? 'منذ' : 'il y a',
        },
    };
};
