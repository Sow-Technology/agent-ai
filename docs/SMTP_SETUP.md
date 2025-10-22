# Contact Form Email Setup Guide

## Overview
The contact form sends emails via SMTP. This guide shows how to configure your SMTP provider.

## Environment Variables

Add these to your `.env.local` file:

```env
SMTP_HOST=your_smtp_host.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=noreply@assureqai.com
```

## SMTP Provider Configurations

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

**Important:** Use an [App Password](https://support.google.com/accounts/answer/185833), not your regular Gmail password.

Steps:
1. Enable 2-Factor Authentication in Google Account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and "Windows Computer"
4. Copy the 16-character password
5. Use it as `SMTP_PASSWORD`

### Outlook / Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@outlook.com
SMTP_PASSWORD=your_password
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.your_api_key
SMTP_FROM_EMAIL=your_verified_sender@domain.com
```

### AWS SES (Simple Email Service)
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_ses_username
SMTP_PASSWORD=your_ses_password
SMTP_FROM_EMAIL=verified_sender@your_domain.com
```

### Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@yourdomain.com
SMTP_PASSWORD=your_password
```

## How It Works

When someone submits the contact form:

1. **Form Submission:** User fills out name, email, company, and message
2. **API Endpoint:** Data is sent to `/api/contact`
3. **Validation:** Required fields are checked
4. **Email to Support:** Email sent to `support@assureqai.com` with:
   - User's name, email, company
   - Full message
   - Reply-To address set to user's email
5. **Confirmation:** User receives confirmation email at their address
6. **Success Response:** User sees success toast notification

## Email Format

### Incoming Email (to support@assureqai.com)
- From: Configured SMTP sender
- Reply-To: User's email address
- Subject: "New Contact Form Submission from [Name]"
- Contains: Name, email, company, and message

### Confirmation Email (to user)
- From: Configured SMTP sender
- To: User's email
- Subject: "We received your message - AssureQAI"
- Contains: Copy of their message for reference

## Testing

You can test the contact form by:
1. Visiting `/contact` page
2. Filling out the form
3. Submitting
4. Check if emails are received at `support@assureqai.com` and user's email

## Troubleshooting

### "Email service not configured"
- Ensure all SMTP env variables are set
- Check `.env.local` has all required fields

### Connection refused
- Verify SMTP_HOST and SMTP_PORT are correct
- Check firewall isn't blocking the port
- Ensure credentials are correct

### Authentication failed
- Double-check SMTP_USER and SMTP_PASSWORD
- For Gmail, use App Password, not regular password
- For SendGrid, ensure SMTP_USER is "apikey"

### Emails not received
- Check spam/junk folder
- Verify sender domain isn't blocklisted
- For custom domains, configure SPF/DKIM records

## Production Checklist

- [ ] SMTP credentials are set in production environment
- [ ] Using strong, app-specific passwords (not account passwords)
- [ ] SPF, DKIM, DMARC records configured (if using custom domain)
- [ ] "From" email address is verified with SMTP provider
- [ ] Test sending multiple emails to ensure reliability
- [ ] Monitor SMTP logs for delivery issues
