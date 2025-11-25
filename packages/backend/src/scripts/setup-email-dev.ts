/**
 * Email Setup Script for Local Development
 * 
 * This script generates test email credentials using Ethereal Email
 * and provides instructions for other email services.
 * 
 * Run: npm run setup-email
 */

import nodemailer from 'nodemailer';

async function setupEtherealEmail() {
  try {
    console.log('\n🚀 Setting up email for local development...\n');

    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();

    console.log('✅ Ethereal Email Account Created!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 ETHEREAL EMAIL CREDENTIALS (Free Test Account)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Add these to your .env file:\n');
    console.log('SMTP_HOST=smtp.ethereal.email');
    console.log('SMTP_PORT=587');
    console.log(`SMTP_USER=${testAccount.user}`);
    console.log(`SMTP_PASS=${testAccount.pass}`);
    console.log('EMAIL_FROM=noreply@joya.com');
    console.log('EMAIL_TO=admin@joya.com');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📬 How to view sent emails:');
    console.log(`   Visit: https://ethereal.email/messages\n`);
    console.log(`   OR check logs for direct email preview URL\n`);

    // Test the connection
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    console.log('🔍 Testing connection...\n');
    await transporter.verify();
    console.log('✅ Connection successful!\n');

    // Send a test email
    const info = await transporter.sendMail({
      from: '"JOYA Test" <noreply@joya.com>',
      to: 'admin@joya.com',
      subject: '✅ Email Setup Complete - JOYA Backend',
      text: 'If you can see this, your email configuration is working!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4CAF50;">✅ Email Setup Complete!</h1>
            <p>Your JOYA backend email system is configured correctly.</p>
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>SMTP Host: ${testAccount.smtp.host}</li>
              <li>SMTP Port: ${testAccount.smtp.port}</li>
              <li>Secure: ${testAccount.smtp.secure ? 'Yes' : 'No'}</li>
            </ul>
            <p>You can now receive contact form submissions via email!</p>
          </div>
        </div>
      `
    });

    console.log('📨 Test email sent!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 Preview test email:');
    console.log(`   ${nodemailer.getTestMessageUrl(info)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✨ Setup complete! Your backend is ready to send emails.\n');

  } catch (error) {
    console.error('❌ Error setting up email:', error);
    process.exit(1);
  }
}

function printAlternativeOptions() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 ALTERNATIVE EMAIL SERVICES FOR DEVELOPMENT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('1️⃣  MAILTRAP (Recommended for Teams)');
  console.log('   - Sign up: https://mailtrap.io/');
  console.log('   - Free tier: 500 emails/month');
  console.log('   - Features: Email testing, debugging, team collaboration\n');
  console.log('   SMTP_HOST=sandbox.smtp.mailtrap.io');
  console.log('   SMTP_PORT=2525');
  console.log('   SMTP_USER=<your-username>');
  console.log('   SMTP_PASS=<your-password>\n');

  console.log('2️⃣  GMAIL (Quick Test Only)');
  console.log('   - Enable 2FA: https://myaccount.google.com/security');
  console.log('   - Create App Password: https://myaccount.google.com/apppasswords');
  console.log('   - ⚠️  NOT recommended for production\n');
  console.log('   SMTP_HOST=smtp.gmail.com');
  console.log('   SMTP_PORT=587');
  console.log('   SMTP_USER=your-email@gmail.com');
  console.log('   SMTP_PASS=<app-specific-password>\n');

  console.log('3️⃣  SENDGRID (Production Ready)');
  console.log('   - Sign up: https://sendgrid.com/');
  console.log('   - Free tier: 100 emails/day');
  console.log('   - Great for production\n');
  console.log('   SMTP_HOST=smtp.sendgrid.net');
  console.log('   SMTP_PORT=587');
  console.log('   SMTP_USER=apikey');
  console.log('   SMTP_PASS=<your-api-key>\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run the setup
setupEtherealEmail()
  .then(() => {
    printAlternativeOptions();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to setup email:', error);
    process.exit(1);
  });

