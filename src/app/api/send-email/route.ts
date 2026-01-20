import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, company, message, plan, type = 'Contact Form' } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.in",
      port: 465,
      secure: true,
      auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_APP_PASSWORD,
      },
    });

    // Build subject line with plan if available
    const subjectLine = plan
      ? `New ${type} Submission from ${name} - ${plan} Plan`
      : `New ${type} Submission from ${name}`;

    const mailOptions = {
      from: process.env.ZOHO_EMAIL,
      to: "sales@assureqai.com",
      subject: subjectLine,
      text: `
        New submission received from ${type}:

        Name: ${name}
        Email: ${email}
        Company: ${company || 'N/A'}${plan ? `
        Selected Plan: ${plan}` : ''}
        
        Message:
        ${message}
      `,
      html: `
        <h2>New submission received from ${type}</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || 'N/A'}</p>${plan ? `
        <p><strong>Selected Plan:</strong> <span style="color: #10b981; font-weight: bold;">${plan}</span></p>` : ''}
        <br/>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
