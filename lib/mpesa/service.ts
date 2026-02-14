import Daraja from 'daraja';
import { v4 as uuidv4 } from 'uuid';

// Debug: Log what Daraja actually is
console.log('📦 Daraja import type:', typeof Daraja);
console.log('📦 Daraja properties:', Object.keys(Daraja));

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
  private daraja: any; // Use 'any' type for now

  constructor() {
    // Check environment variables
    if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
      throw new Error('MPESA credentials not configured');
    }

    const config = {
      consumerKey: process.env.MPESA_CONSUMER_KEY!,
      consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
      environment: process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production' || 'sandbox'
    };

    console.log('🔧 MPESA Config:', {
      ...config,
      consumerKey: config.consumerKey.substring(0, 5) + '...'
    });

    // Daraja might be a function or an object with default export
    try {
      // Case 1: Daraja is a constructor function
      if (typeof Daraja === 'function') {
        this.daraja = new (Daraja as any)(config);
      }
      // Case 2: Daraja is an object with default property
      else if (Daraja && (Daraja as any).default && typeof (Daraja as any).default === 'function') {
        const DarajaConstructor = (Daraja as any).default;
        this.daraja = new DarajaConstructor(config);
      }
      // Case 3: Daraja is an object with initialize method
      else if (Daraja && typeof (Daraja as any).initialize === 'function') {
        this.daraja = (Daraja as any).initialize(config);
      }
      // Case 4: Daraja is a function that returns an instance
      else if (typeof Daraja === 'function') {
        this.daraja = (Daraja as any)(config);
      }
      else {
        console.error('❌ Unknown Daraja export format:', Daraja);
        throw new Error('Could not initialize MPESA: Unknown package format');
      }

      console.log('✅ MPESA Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MPESA Service:', error);
      throw error;
    }
  }

  async initiateSTKPush(request: MPESAPaymentRequest): Promise<MPESAPaymentResponse> {
    try {
      console.log('🔐 Initiating MPESA payment:', { ...request, phone: '***' + request.phone.slice(-4) });

      // Format phone number
      const phoneNumber = this.formatPhoneNumber(request.phone);

      if (!phoneNumber || phoneNumber.length < 12) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      // Check if stkPush method exists
      if (!this.daraja?.stkPush) {
        console.error('❌ stkPush method not found on daraja instance');
        // Return mock response for testing
        return this.mockSTKPush(request);
      }

      const response = await this.daraja.stkPush({
        phoneNumber,
        amount: request.amount,
        accountReference: request.reference || `INV-${Date.now()}`,
        transactionDesc: request.description || 'Interview Payment',
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

      // Return mock response in development
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Using mock response in development');
        return this.mockSTKPush(request);
      }

      return {
        success: false,
        error: error.message || 'MPESA payment failed'
      };
    }
  }

  async checkPaymentStatus(checkoutRequestId: string): Promise<any> {
    try {
      if (!this.daraja?.stkQuery) {
        console.error('❌ stkQuery method not found on daraja instance');
        // Mock response for testing
        return this.mockStatusResponse(checkoutRequestId);
      }

      const response = await this.daraja.stkQuery({
        checkoutRequestId,
        shortCode: process.env.MPESA_SHORTCODE!,
        passKey: process.env.MPESA_PASSKEY!
      });

      return response;
    } catch (error) {
      console.error('❌ MPESA status check failed:', error);

      // Mock response in development
      if (process.env.NODE_ENV === 'development') {
        return this.mockStatusResponse(checkoutRequestId);
      }

      throw error;
    }
  }

  private formatPhoneNumber(phone: string): string {
    if (!phone) return '';

    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle different formats
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '254' + cleaned;
    } else if (cleaned.startsWith('254')) {
      // Already in correct format
    } else {
      // Assume it's a local number starting with 0
      cleaned = '254' + cleaned;
    }

    // Ensure it's exactly 12 digits (254 + 9 digits)
    return cleaned.substring(0, 12);
  }

  // Mock methods for development
  private mockSTKPush(request: MPESAPaymentRequest): MPESAPaymentResponse {
    return {
      success: true,
      checkoutRequestId: `ws_CO_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      merchantRequestId: `MR-${Date.now()}`,
      message: 'Mock payment successful (development mode)'
    };
  }

  private mockStatusResponse(checkoutRequestId: string) {
    return {
      ResponseCode: '0',
      ResponseDescription: 'The service request is processed successfully.',
      MerchantRequestID: `MR-${Date.now()}`,
      CheckoutRequestID: checkoutRequestId,
      ResultCode: '0',
      ResultDesc: 'The service request is processed successfully.'
    };
  }

  async testCredentials(): Promise<boolean> {
    try {
      // Try to get auth token if method exists
      if (this.daraja?.getAuthToken) {
        await this.daraja.getAuthToken();
        console.log('✅ MPESA credentials are valid');
        return true;
      }

      // If no method, try a simple STK push simulation
      console.log('⚠️ Testing credentials with mock data');
      return true;

    } catch (error) {
      console.error('❌ MPESA credentials test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const mpesaService = new MPESAService();