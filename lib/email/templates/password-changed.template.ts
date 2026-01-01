export function passwordChangedEmailTemplate(firstName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
    <h1 style="color: #2563eb; margin-bottom: 20px;">Password Changed Successfully</h1>
    
    <p>Hi ${firstName},</p>
    
    <p>This email confirms that your password for your InventoryPro account has been successfully changed.</p>
    
    <p><strong>If you made this change:</strong></p>
    <p>No further action is required. You can continue using InventoryPro with your new password.</p>
    
    <p><strong>If you didn't make this change:</strong></p>
    <p>Your account may have been compromised. Please contact our support team immediately and consider taking the following steps:</p>
    <ul>
      <li>Reset your password immediately</li>
      <li>Review your account activity</li>
      <li>Enable two-factor authentication if available</li>
    </ul>
    
    <div style="margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" 
         style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Contact Support
      </a>
    </div>
    
    <p>Best regards,<br>The InventoryPro Team</p>
  </div>
  
  <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
    <p>This email was sent from InventoryPro. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `;
}
