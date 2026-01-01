export function accountCreatedEmailTemplate(
  firstName: string,
  tempPassword: string,
  loginLink: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Account Has Been Created</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
    <h1 style="color: #2563eb; margin-bottom: 20px;">Your Account Has Been Created</h1>
    
    <p>Hi ${firstName},</p>
    
    <p>An administrator has created an account for you on InventoryPro. You can now log in and start using the system.</p>
    
    <div style="background-color: #fff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
      <p style="margin: 0;"><strong>Temporary Password:</strong></p>
      <p style="margin: 5px 0; font-family: monospace; font-size: 16px; color: #dc2626;">${tempPassword}</p>
    </div>
    
    <p><strong>Important:</strong> For security reasons, please change your password after your first login.</p>
    
    <div style="margin: 30px 0;">
      <a href="${loginLink}" 
         style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Log In Now
      </a>
    </div>
    
    <p>If you have any questions or need assistance, please contact your administrator.</p>
    
    <p>Best regards,<br>The InventoryPro Team</p>
  </div>
  
  <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
    <p>This email was sent from InventoryPro. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `;
}
