export function welcomeEmailTemplate(firstName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to InventoryPro</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
    <h1 style="color: #2563eb; margin-bottom: 20px;">Welcome to InventoryPro!</h1>
    
    <p>Hi ${firstName},</p>
    
    <p>Welcome to InventoryPro! We're excited to have you on board.</p>
    
    <p>You can now start managing your inventory, tracking sales, and generating reports with ease.</p>
    
    <div style="margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
         style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Go to Dashboard
      </a>
    </div>
    
    <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
    
    <p>Best regards,<br>The InventoryPro Team</p>
  </div>
  
  <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
    <p>This email was sent from InventoryPro. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `;
}
