# ⛪ M-Pesa Donation System: Testing Manual

This guide explains how to test the M-Pesa STK Push donation integration safely and effectively using the Safaricom Daraja Sandbox environment.

---

## 🛠 1. Preliminary Setup (Environment)

Ensure your `backEnd/.env` file contains the correct credentials. Based on your current setup:

- **SHORTCODE**: `174379`
- **PASSKEY**: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`
- **CONSUMER_KEY**: Provided in your `.env`
- **CONSUMER_SECRET**: Provided in your `.env`

### 🏗 2. Dynamic Tunneling (Ngrok)
Since Safaricom needs to reach your local computer to notify the site of a successful payment, you **must** use a tunnel.

1.  Open your terminal.
2.  Run: `ngrok http 3001` (or your backend port).
3.  Copy the `Forwarding` URL (e.g., `https://abcdef.ngrok-free.app`).
4.  Update your `backEnd/.env` file:
    ```env
    CALLBACK_URL=https://[YOUR_NGROK_ID].ngrok-free.app/authentication/v1/mpesa/callback
    ```
5.  **Restart your backend server** to apply the changes.

---

## 🚀 3. Testing the User Flow

1.  **Open the Application**: Navigate to the landing page (`http://localhost:5173` or `5174`).
2.  **Trigger Donation**: Click the **"Donate"** button in the Navbar or the **"Donate Now"** button in the Support section.
3.  **Enter Amount**: Type a small amount for testing (e.g., `1` for KES 1).
4.  **Enter Phone Number**: Use a valid Safaricom number (e.g., `0712345678`).
5.  **Initiate**: Click **"Donate via M-Pesa"**.

---

## 📋 4. What to Expect (Success Case)

### Stage A: Immediate UI Response
- The button will change to **"Processing..."** with a loading spinner.
- The server will communicate with Safaricom.
- If successful, the modal will change to showing a **Green Checkmark** and the message: *"STK Push Sent"*.

### Stage B: On Your Phone
- You will receive a **Standard STK Push Popup** on your phone.
- It will show: *"Do you want to pay KES 1.00 to [ShortCode Name] Account YogurtBlast?"*.
- **Enter PIN**: Since this is a test (Sandbox), no real money is deducted. You can enter your PIN safely.

### Stage C: Database Confirmation
- After entering the PIN, Safaricom sends a "Callback" to your Ngrok URL.
- The backend will process this.
- Go to your database and check the `mpesa_request` table.
- **Expected Record**: A row with `status='paid'` and your phone number.

---

## ⚠️ 5. Common Troubleshooting

| Issue | Reason | Solution |
| :--- | :--- | :--- |
| **"Connection Error"** | Backend is down or `.env` is wrong. | Check if backend terminal is running. |
| **No Prompt on Phone** | Incorrect number format or Safaricom issue. | Use `07XXXXXXXX` or `254XXXXXXXX`. |
| **Status stays 'pending'** | Ngrok is not running or URL is wrong. | Ensure `CALLBACK_URL` matches exactly your Ngrok URL. |
| **"Invalid Credentials"** | CONSUMER_KEY or SECRET has expired. | Generate fresh keys at the Daraja Portal. |

---

> [!IMPORTANT]
> **Account Reference**: Currently set to `YogurtBlast` or `Donation` by default. This can be changed in the `stkController.js` file if you wish to personalize the message on the phone prompt.
