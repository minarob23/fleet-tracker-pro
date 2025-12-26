import pool from '../db.js';

interface WhatsAppMessage {
    to: string;
    message: string;
    truckId?: string;
}

/**
 * City contact phone numbers for WhatsApp notifications
 * Format: country code + number (e.g., 212612345678 for Morocco)
 */
const CITY_CONTACTS: Record<string, string> = {
    'Laayoune': process.env.WHATSAPP_LAAYOUNE || '212600000001',
    'Dakhla': process.env.WHATSAPP_DAKHLA || '212600000002',
    'Smara': process.env.WHATSAPP_SMARA || '212600000003',
    'Guelmim': process.env.WHATSAPP_GUELMIM || '212600000004',
};

/**
 * Send WhatsApp message using WhatsApp Business API or third-party service
 * Currently using WhatsApp Web link (simple implementation)
 * TODO: Integrate with WhatsApp Business API or Twilio
 */
export const sendWhatsAppNotification = async (data: WhatsAppMessage): Promise<boolean> => {
    try {
        // Log notification
        await pool.query(
            `INSERT INTO notifications_log (truck_id, notification_type, recipient, message, status)
       VALUES ($1, $2, $3, $4, $5)`,
            [data.truckId || null, 'whatsapp', data.to, data.message, 'pending']
        );

        // TODO: Implement actual WhatsApp API integration
        // For now, we'll just log the message
        console.log(`📱 WhatsApp notification to ${data.to}: ${data.message}`);

        // Update notification status
        await pool.query(
            `UPDATE notifications_log 
       SET status = 'sent', sent_at = NOW()
       WHERE recipient = $1 AND message = $2 AND status = 'pending'`,
            [data.to, data.message]
        );

        return true;
    } catch (error: any) {
        console.error('WhatsApp notification error:', error);

        // Log error
        await pool.query(
            `UPDATE notifications_log 
       SET status = 'failed', error_message = $1
       WHERE recipient = $2 AND message = $3 AND status = 'pending'`,
            [error.message, data.to, data.message]
        );

        return false;
    }
};

/**
 * Send arrival notification to city contact
 */
export const sendArrivalNotification = async (truck: any): Promise<void> => {
    const cityContact = CITY_CONTACTS[truck.destination];

    if (!cityContact) {
        console.warn(`No WhatsApp contact configured for city: ${truck.destination}`);
        return;
    }

    const now = new Date();
    const arrivalDate = now.toLocaleDateString('ar-MA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const arrivalTime = now.toLocaleTimeString('ar-MA', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Create Google Maps link
    const mapsLink = truck.latitude && truck.longitude
        ? `https://www.google.com/maps?q=${truck.latitude},${truck.longitude}`
        : 'غير متوفر';

    const message = `
مساء الخير السيد رئيس المصلحة الخارجية للمكتب الوطني للحبوب والقطاني – الإقليم،

وصلت شاحنة مقطورة محملة بـ (${getProductNameArabic(truck.product_type)}) إلى (${arrivalDate} - ${arrivalTime})، وذلك حسب المعطيات التالية:

• الجماعة: ${truck.destination || 'غير محدد'}
• المنتوج: ${getProductNameArabic(truck.product_type)}
• العلامة التجارية: ${truck.supplier_name || 'غير محدد'}
• الكمية: ${truck.cargo_type || 'غير محدد'}
• هاتف السائق: ${truck.driver_phone || 'غير محدد'}
• تاريخ الشحن: ${truck.created_at ? new Date(truck.created_at).toLocaleDateString('ar-MA') : 'غير محدد'}

📍 رابط تحديد الموقع:
${mapsLink}

مع فائق عبارات التقدير 😊
    `.trim();

    await sendWhatsAppNotification({
        to: cityContact,
        message,
        truckId: truck.id,
    });
};

/**
 * Get product name in Arabic
 */
function getProductNameArabic(productType: string): string {
    const productNames: Record<string, string> = {
        'flour': 'دقيق',
        'sugar': 'سكر',
        'oil': 'زيت',
    };
    return productNames[productType] || productType;
}

/**
 * Send custom WhatsApp message to driver
 */
export const sendDriverMessage = async (
    driverPhone: string,
    message: string,
    truckId?: string
): Promise<boolean> => {
    return sendWhatsAppNotification({
        to: driverPhone,
        message,
        truckId,
    });
};
