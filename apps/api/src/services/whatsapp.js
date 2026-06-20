"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsAppMessage = sendWhatsAppMessage;
const axios_1 = __importDefault(require("axios"));
const db_js_1 = require("../db.js");
const getWhatsAppConfig = () => {
    return {
        accessToken: process.env.META_WHATSAPP_ACCESS_TOKEN,
        phoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID
    };
};
async function sendWhatsAppMessage(to, message, branchId) {
    const { accessToken, phoneNumberId } = getWhatsAppConfig();
    const cleanPhone = to.replace(/[^0-9]/g, '');
    console.log(`[WhatsApp Simulation] Sending to ${cleanPhone}: "${message}"`);
    // Log in Audit Logs
    try {
        await db_js_1.prisma.auditLog.create({
            data: {
                actor: 'SYSTEM_WHATSAPP',
                role: 'OWNER',
                action: 'WHATSAPP_ALERT_DISPATCHED',
                details: `Simulated WhatsApp sent to ${cleanPhone}: ${message.substring(0, 100)}...`,
                branchId: branchId
            }
        });
    }
    catch (err) {
        console.error('Failed to log WhatsApp audit event:', err);
    }
    // If token and ID exist, try hitting the Meta API
    if (accessToken && phoneNumberId) {
        try {
            await axios_1.default.post(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
                messaging_product: 'whatsapp',
                to: cleanPhone,
                type: 'text',
                text: { body: message }
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return true;
        }
        catch (error) {
            console.error('[WhatsApp Service Error] Failed sending via Meta Cloud API:', error?.response?.data || error?.message);
            return false;
        }
    }
    // Return true as simulated success otherwise
    return true;
}
