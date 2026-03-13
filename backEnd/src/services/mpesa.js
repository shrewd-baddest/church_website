import axios from 'axios';

export class MpesaService {
    static consumerKey = 'YOUR_SANDBOX_CONSUMER_KEY'; // Placeholder for sandbox
    static consumerSecret = 'YOUR_SANDBOX_CONSUMER_SECRET'; // Placeholder for sandbox
    static shortCode = '174379'; // Common Sandbox Shortcode
    static passKey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'; // Common Sandbox Passkey
    static baseUrl = 'https://sandbox.safaricom.co.ke';

    static async getAccessToken() {
        const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
        try {
            const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
                headers: { Authorization: `Basic ${auth}` }
            });
            return response.data.access_token;
        } catch (error) {
            console.error('Error fetching M-Pesa access token:', error);
            throw new Error('Could not authenticate with Safaricom');
        }
    }

    static async stkPush(phoneNumber, amount, callbackUrl) {
        const token = await this.getAccessToken();
        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
        const password = Buffer.from(`${this.shortCode}${this.passKey}${timestamp}`).toString('base64');

        // Transform 07... or 254... to 254...
        let formattedPhone = phoneNumber.replace(/\+/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.slice(1);
        }

        const data = {
            BusinessShortCode: this.shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: formattedPhone,
            PartyB: this.shortCode,
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: 'CSAChoir',
            TransactionDesc: 'Choir Registration Fee'
        };

        try {
            const response = await axios.post(`${this.baseUrl}/mpesa/stkpush/v1/query`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('M-Pesa STK Push error:', error.response?.data || error.message);
            throw new Error('Failed to initiate M-Pesa payment');
        }
    }

    // Helper to generate password (redundant but clean)
    static getPassword(shortCode, passKey, timestamp) {
        return Buffer.from(`${shortCode}${passKey}${timestamp}`).toString('base64');
    }
}
