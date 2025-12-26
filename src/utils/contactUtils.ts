import { ContactMethod } from '@/types/truck';

/**
 * Generate WhatsApp URL with message
 */
export const getWhatsAppUrl = (phone: string, message: string): string => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Generate Telegram URL with message
 */
export const getTelegramUrl = (phone: string, message: string): string => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://t.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Generate Phone Call URL
 */
export const getPhoneCallUrl = (phone: string): string => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `tel:${cleanPhone}`;
};

/**
 * Generate SMS URL with message
 */
export const getSMSUrl = (phone: string, message: string): string => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
};

/**
 * Get tracking link message for driver
 */
export const getTrackingMessage = (
    driverName: string,
    plateNumber: string,
    gpsNumber: string,
    trackingUrl: string,
    language: 'ar' | 'fr' = 'ar'
): string => {
    if (language === 'ar') {
        return `مرحباً ${driverName} 👋\n\nيرجى تفعيل تتبع الشاحنة رقم: ${plateNumber}\n\nاضغط على الرابط وابدأ التتبع:\n${trackingUrl}\n\nالخطوات:\n1️⃣ اضغط على الرابط\n2️⃣ اسمح بالوصول للموقع\n3️⃣ اضغط "بدء التتبع"\n\nشكراً 🚛`;
    } else {
        return `Bonjour ${driverName} 👋\n\nVeuillez activer le suivi du camion n°: ${plateNumber}\n\nCliquez sur le lien et commencez le suivi:\n${trackingUrl}\n\nÉtapes:\n1️⃣ Cliquez sur le lien\n2️⃣ Autorisez l'accès à la localisation\n3️⃣ Appuyez sur "Démarrer le suivi"\n\nMerci 🚛`;
    }
};

/**
 * Get tracking URL for driver app
 */
export const getTrackingUrl = (gpsNumber: string): string => {
    const serverIP = window.location.hostname;
    const serverPort = window.location.port || '8080';
    return `http://${serverIP}:${serverPort}/driver-app?device=${gpsNumber}`;
};

/**
 * Open contact URL based on contact method
 */
export const openContactUrl = (
    contactMethod: ContactMethod,
    phone: string,
    message?: string
): void => {
    let url: string;

    switch (contactMethod) {
        case 'whatsapp':
            url = getWhatsAppUrl(phone, message || '');
            break;
        case 'telegram':
            url = getTelegramUrl(phone, message || '');
            break;
        case 'phone':
            url = message ? getSMSUrl(phone, message) : getPhoneCallUrl(phone);
            break;
        default:
            url = getWhatsAppUrl(phone, message || '');
    }

    window.open(url, '_blank');
};
