export function verificationEmailTemplate(firstName: string, verificationLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
    <h1 style="color: #2563eb; margin-bottom: 20px;">Verify Your Email Address</h1>
    
    <p>Hi ${firstName},</p>
    
    <p>Thank you for registering with InventoryPro! To complete your registration, please verify your email address by clicking the button below:</p>
    
    <div style="margin: 30px 0;">
      <a href="${verificationLink}" 
         style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Verify Email Address
      </a>
    </div>
    
    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #2563eb;">${verificationLink}</p>
    
    <p><strong>This link will expire in 24 hours.</strong></p>
    
    <p>If you didn't create an account with InventoryPro, you can safely ignore this email.</p>
    
    <p>Best regards,<br>The InventoryPro Team</p>
  </div>
  
  <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
    <p>This email was sent from InventoryPro. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `;
}
