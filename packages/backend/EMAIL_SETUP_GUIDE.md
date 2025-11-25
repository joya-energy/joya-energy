# 📧 Email Configuration Guide for JOYA Backend

This guide will help you set up email functionality for local development and testing.

---

## 🚀 Quick Start (Recommended for Development)

### Option 1: Ethereal Email (Fastest - No Signup)

**Best for:** Quick local testing, no registration required

1. **Run the setup script:**
   ```bash
   cd packages/backend
   npm run setup-email
   ```

2. **Copy the generated credentials** to your `.env` file

3. **View sent emails** using the preview URL shown in the console

**Pros:** ✅ No signup, instant setup, automatic preview URLs  
**Cons:** ❌ Temporary accounts, not persistent

---

### Option 2: Mailtrap (Best for Team Development)

**Best for:** Team development, persistent inbox, debugging emails

1. **Sign up for free:** https://mailtrap.io/
2. **Get credentials:**
   - Go to "Email Testing" → "Inboxes"
   - Click on your inbox
   - Copy SMTP credentials

3. **Add to `.env`:**
   ```env
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your-mailtrap-username
   SMTP_PASS=your-mailtrap-password
   EMAIL_FROM=noreply@joya.com
   EMAIL_TO=admin@joya.com
   ```

4. **Test it:**
   ```bash
   npm run test-email
   ```

**Pros:** ✅ Team collaboration, persistent inbox, debugging tools  
**Cons:** ❌ Requires signup

---

### Option 3: Gmail (Quick Personal Testing)

**Best for:** Quick personal testing only

⚠️ **Warning:** Not recommended for production or shared development

1. **Enable 2-Factor Authentication:**
   - Go to https://myaccount.google.com/security
   - Enable 2FA if not already enabled

2. **Create App Password:**
   - Visit https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Add to `.env`:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   EMAIL_TO=recipient@example.com
   ```

**Pros:** ✅ Easy setup if you have Gmail  
**Cons:** ❌ Daily sending limits, not for production

---

## 📝 Step-by-Step Setup

### 1. Create your `.env` file

```bash
cd packages/backend
cp env.example .env
```

### 2. Configure your email settings

Edit `.env` and uncomment/configure one of the email options:

```env
# Required Environment Variables
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/joya

# Email Configuration (choose one option below)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-username@ethereal.email
SMTP_PASS=your-password
EMAIL_FROM=noreply@joya.com
EMAIL_TO=admin@joya.com
```

### 3. Test your configuration

Create a test script or use this quick test:

```bash
npm run test-email
```

---

## 🧪 Testing Email Functionality

### Manual Test via API

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Send a test contact form request:**
   ```bash
   curl -X POST http://localhost:3000/api/contacts \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "message": "This is a test message"
     }'
   ```

3. **Check for email:**
   - **Ethereal:** Check console for preview URL
   - **Mailtrap:** Check your Mailtrap inbox
   - **Gmail:** Check your Gmail inbox

### Using Postman/Insomnia

**POST** `http://localhost:3000/api/contacts`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello! I'd like to get in touch about your services."
}
```

**Expected Response (201 Created):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello! I'd like to get in touch about your services.",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 🔧 Troubleshooting

### Issue: "Mail configuration is incomplete"

**Solution:** Make sure all required environment variables are set:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_TO`

Check your `.env` file exists in `packages/backend/`

### Issue: "Failed to send email: Connection timeout"

**Possible causes:**
1. Firewall blocking SMTP ports (587, 465, 2525)
2. Wrong SMTP host/port
3. VPN interfering with connection

**Solutions:**
- Try different port: 587 (TLS) or 465 (SSL)
- Disable VPN temporarily
- Check firewall settings

### Issue: "Authentication failed"

**Solutions:**
- Verify SMTP_USER and SMTP_PASS are correct
- For Gmail: Make sure you're using App Password, not regular password
- For Mailtrap: Copy credentials directly from dashboard

### Issue: Email sent but not received

**This is actually working!** 🎉

Your email service (Ethereal, Mailtrap) is catching emails in development.
- Check the console logs for preview URLs
- Login to your email service dashboard
- For production, configure a real SMTP service

---

## 🏗️ Environment-Specific Configuration

### Development (Local)
```env
NODE_ENV=development
# Use Ethereal or Mailtrap
SMTP_HOST=smtp.ethereal.email
# ... rest of config
```

### Staging/Production
```env
NODE_ENV=production
# Use production email service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_TO=admin@yourdomain.com
```

---

## 🚀 Production Email Services

### SendGrid (Recommended)

**Free Tier:** 100 emails/day  
**Pricing:** $15/month for 40k emails

1. Sign up: https://sendgrid.com/
2. Verify your sender email
3. Create API key
4. Configure:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.xxxxx
   ```

### Mailgun

**Free Tier:** 5,000 emails/month (3 months)  
**Pricing:** $35/month for 50k emails

1. Sign up: https://www.mailgun.com/
2. Verify domain
3. Get SMTP credentials
4. Configure accordingly

### AWS SES

**Pricing:** $0.10 per 1,000 emails  
**Best for:** High volume, AWS ecosystem

1. Set up AWS account
2. Verify email/domain in SES
3. Create SMTP credentials
4. Configure accordingly

---

## 📊 Email Template (Current Implementation)

The contact form email includes:

```
Subject: New contact from {name}

Body:
- Name: {name}
- Email: {email}
- Message: {message}
```

The HTML version is formatted with proper styling.

---

## 🔐 Security Best Practices

1. ✅ **Never commit `.env` files** (already in `.gitignore`)
2. ✅ **Use app-specific passwords** for Gmail
3. ✅ **Rotate credentials regularly** in production
4. ✅ **Use environment variables** (not hardcoded values)
5. ✅ **Limit EMAIL_TO** to trusted recipients
6. ⚠️ **Add rate limiting** for contact form (see recommendations)

---

## 🧪 Running Tests

Once email is configured, test the full flow:

```bash
# Unit tests
npm test

# Test contact service
npm test -- contact.service.spec.ts

# Test email sending
npm run test-email
```

---

## 📚 Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Ethereal Email](https://ethereal.email/)
- [Mailtrap Documentation](https://mailtrap.io/docs/)
- [SendGrid SMTP Setup](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)

---

## 🆘 Need Help?

If you're still having issues:

1. Check server logs for detailed error messages
2. Verify `.env` file is in the correct location
3. Test SMTP credentials using an online SMTP tester
4. Check if your ISP blocks SMTP ports
5. Try different email service (Ethereal is most reliable for dev)

---

**Happy coding! 🎉**

