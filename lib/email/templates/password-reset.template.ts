export function passwordResetEmailTemplate(firstName: string, resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
    <h1 style="color: #2563eb; margin-bottom: 20px;">Reset Your Password</h1>
    
    <p>Hi ${firstName},</p>
    
    <p>We received a request to reset your password for your InventoryPro account. Click the button below to create a new password:</p>
    
    <div style="margin: 30px 0;">
      <a href="${resetLink}" 
         style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Reset Password
      </a>
    </div>
    
    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #2563eb;">${resetLink}</p>
    
    <p><strong>This link will expire in 1 hour.</strong></p>
    
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    
    <p>For security reasons, we recommend that you:</p>
    <ul>
      <li>Use a strong, unique password</li>
      <li>Don't share your password with anyone</li>
      <li>Change your password regularly</li>
    </ul>
    
    <p>Best regards,<br>The InventoryPro Team</p>
  </div>
  
  <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
    <p>This email was sent from InventoryPro. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `;
}
