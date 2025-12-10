# 📧 Email Configuration Summary

## 🎯 What You Need

Your contact form sends email notifications when someone submits the form. You need to configure these environment variables:

```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
EMAIL_FROM=noreply@joya.com
EMAIL_TO=admin@joya.com
```

---

## ⚡ Quick Setup Options

### Option 1: Automated Setup (Recommended for Testing)
```bash
npm run setup-email
```
This generates test credentials and tests your connection automatically.

### Option 2: Manual Setup
1. Read `QUICK_START_EMAIL.md` for 5-minute setup
2. Read `EMAIL_SETUP_GUIDE.md` for detailed instructions

---

## 🧪 How to Test

### 1. Start Server
```bash
npm run dev
```

### 2. Test Contact Form
Use the `test-contact-api.http` file with REST Client extension, or:

```bash
curl -X POST http://localhost:3001/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Hello!"}'
```

### 3. Check Email
- **Console logs** will show "Email dispatched to..."
- **Ethereal**: Console will show preview URL
- **Mailtrap**: Check your Mailtrap inbox
- **Gmail**: Check your Gmail inbox

---

## 📁 Files Created

- `env.example` - Environment variables template
- `QUICK_START_EMAIL.md` - 5-minute setup guide
- `EMAIL_SETUP_GUIDE.md` - Comprehensive documentation
- `src/scripts/setup-email-dev.ts` - Automated setup script
- `test-contact-api.http` - API testing file
- `README_EMAIL.md` - This file

---

## 🔧 Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server address | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` |
| `SMTP_PASS` | SMTP password | App password (not regular password) |
| `EMAIL_FROM` | Sender email address | `noreply@joya.com` |
| `EMAIL_TO` | Recipient email (where contacts go) | `admin@joya.com` |

---

## 🎓 Best Practices

### Development
- ✅ Use **Ethereal** or **Mailtrap** (catches all emails)
- ✅ Never use production email service
- ✅ Keep `.env` in `.gitignore`

### Production
- ✅ Use **SendGrid**, **Mailgun**, or **AWS SES**
- ✅ Set up proper domain verification
- ✅ Use environment variables (not `.env` file)
- ✅ Monitor email sending rates and bounces

---

## ❓ FAQ

**Q: Do I need to configure email to test the API?**  
A: No! The API works without email. You'll just see warnings in logs. Email sending is gracefully skipped if not configured.

**Q: Which email service should I use for development?**  
A: **Ethereal** (via `npm run setup-email`) is easiest. **Mailtrap** is best for teams.

**Q: Can I use Gmail for production?**  
A: ❌ No! Gmail has strict sending limits. Use SendGrid, Mailgun, or AWS SES.

**Q: How do I know if email is working?**  
A: Check server logs for "Email dispatched to..." message.

**Q: Where do I put my `.env` file?**  
A: In `packages/backend/` directory (same level as `package.json`)

**Q: Email isn't sending, what should I check?**  
A:
1. Is `.env` file in the correct location?
2. Did you restart the server after changing `.env`?
3. Are all required variables set?
4. Check firewall/antivirus blocking SMTP ports
5. Try `npm run setup-email` for automated testing

---

## 🚀 Production Deployment

Before going to production:

1. Choose a production email service (SendGrid recommended)
2. Verify your domain
3. Set up SPF, DKIM, and DMARC records
4. Configure environment variables in your hosting platform
5. Add rate limiting to prevent abuse
6. Monitor email deliverability

See `EMAIL_SETUP_GUIDE.md` section "Production Email Services" for details.

---

## 📊 What Happens When Contact Form is Submitted

1. Client sends POST to `/api/contacts`
2. Controller validates and calls service
3. Service saves to database
4. Service sends email notification (async, doesn't block response)
5. If email fails, error is logged but API still returns success
6. User gets 201 response with contact data

**Email sending is non-blocking** - even if email fails, the contact is saved.

---

## 🆘 Getting Help

1. Read `EMAIL_SETUP_GUIDE.md` for detailed troubleshooting
2. Check server logs for error messages
3. Verify `.env` configuration
4. Test with `npm run setup-email`
5. Try different email service (Ethereal is most reliable)

---

**Need more help?** Check the detailed guides:
- `QUICK_START_EMAIL.md` - Quick setup
- `EMAIL_SETUP_GUIDE.md` - Full documentation

