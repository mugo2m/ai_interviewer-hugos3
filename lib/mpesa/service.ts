import * as Daraja from 'daraja';
import { v4 as uuidv4 } from 'uuid';

export interface MPESAPaymentRequest {
  phone: string; // Format: 2547XXXXXXXX
  amount: number; // KES
  reference: string; // Your transaction reference
  description: string;
}

export interface MPESAPaymentResponse {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  error?: string;
  message?: string;
}

class MPESAService {
  private daraja: Daraja;

  constructor() {
    this.daraja = new Daraja({
      consumerKey: process.env.MPESA_CONSUMER_KEY!,
      consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
      environment: process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production'
    });
  }

  async initiateSTKPush(request: MPESAPaymentRequest): Promise<MPESAPaymentResponse> {
    try {
      console.log('🔐 Initiating MPESA payment:', request);

      // Format phone number if needed
      const phoneNumber = this.formatPhoneNumber(request.phone);

      const response = await this.daraja.stkPush({
        phoneNumber,
        amount: request.amount,
        accountReference: request.reference,
        transactionDesc: request.description,
        shortCode: process.env.MPESA_SHORTCODE!,
        passKey: process.env.MPESA_PASSKEY!
      });

      console.log('✅ MPESA STK Push initiated:', response);

      return {
        success: true,
        checkoutRequestId: response.CheckoutRequestID,
        merchantRequestId: response.MerchantRequestID,
        message: 'STK Push sent to phone'
      };

    } catch (error: any) {
      console.error('❌ MPESA STK Push failed:', error);
      return {
        success: false,
        error: error.message || 'MPESA payment failed'
      };
    }
  }

  async checkPaymentStatus(checkoutRequestId: string): Promise<any> {
    try {
      const response = await this.daraja.stkQuery({
        checkoutRequestId,
        shortCode: process.env.MPESA_SHORTCODE!,
        passKey: process.env.MPESA_PASSKEY!
      });

      return response;
    } catch (error) {
      console.error('❌ MPESA status check failed:', error);
      throw error;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove any spaces or dashes
    let cleaned = phone.replace(/\D/g, '');

    // Convert to 254 format if needed
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '254' + cleaned;
    }

    // Ensure it's exactly 12 digits
    return cleaned.substring(0, 12);
  }

  // Test if credentials are valid
  async testCredentials(): Promise<boolean> {
    try {
      await this.daraja.getAuthToken();
      console.log('✅ MPESA credentials are valid');
      return true;
    } catch (error) {
      console.error('❌ MPESA credentials are invalid:', error);
      return false;
    }
  }
}

// Singleton instance
export const mpesaService = new MPESAService();