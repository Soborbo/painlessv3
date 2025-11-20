/**
 * EMAIL TEMPLATES
 *
 * Template generation functions
 */

import { CONFIG } from '@/lib/config';
import type { Quote } from '@/lib/core/db/schema';
import { formatPrice } from '@/lib/utils';

/**
 * Generate quote confirmation email
 */
export function generateQuoteConfirmationEmail(quote: Quote, siteUrl: string): string {
  // Read template (in production, you'd read from file)
  const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote Confirmation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .price { font-size: 36px; font-weight: bold; color: #667eea; margin: 20px 0; text-align: center; }
    .breakdown { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .breakdown-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .breakdown-item:last-child { border-bottom: none; font-weight: bold; font-size: 18px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Thank You for Your Quote Request!</h1>
  </div>
  
  <div class="content">
    <p>Hello ${quote.name || 'there'},</p>
    
    <p>Thank you for requesting a quote. Here's a summary of your request:</p>
    
    <div class="price">${formatPrice(quote.totalPrice, quote.currency)}</div>
    
    <div class="breakdown">
      <h3>Price Breakdown:</h3>
      ${generateBreakdownItems(quote.breakdown || {})}
    </div>
    
    <p>Our team will review your request and get back to you within 24 hours.</p>
    
    <center>
      <a href="${siteUrl}" class="button">Visit Our Website</a>
    </center>
    
    <p>If you have any questions, feel free to reply to this email or call us at ${CONFIG.calculator.phoneNumber}.</p>
    
    <p>Best regards,<br>The Calculator Team</p>
  </div>
  
  <div class="footer">
    <p>Quote ID: #${quote.id}</p>
    <p>&copy; 2024 Calculator Boilerplate. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  return template;
}

/**
 * Generate breakdown items HTML
 */
function generateBreakdownItems(breakdown: Record<string, number>): string {
  const items = Object.entries(breakdown).map(([key, value]) => {
    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
    return `
      <div class="breakdown-item">
        <span>${label}</span>
        <span>${formatPrice(value, 'HUF')}</span>
      </div>
    `;
  });

  return items.join('');
}

/**
 * Generate admin notification email
 */
export function generateAdminNotificationEmail(quote: Quote, siteUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Quote Request</title>
</head>
<body style="font-family: sans-serif; padding: 20px;">
  <h2>New Quote Request #${quote.id}</h2>
  
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${quote.name || 'N/A'}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${quote.email || 'N/A'}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${quote.phone || 'N/A'}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Total Price:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${formatPrice(quote.totalPrice, quote.currency)}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Language:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${quote.language}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Country:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${quote.country || 'N/A'}</td>
    </tr>
  </table>
  
  <h3>Calculator Data:</h3>
  <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow: auto;">${JSON.stringify(quote.calculatorData, null, 2)}</pre>
  
  <p>
    <a href="${siteUrl}/admin/quotes?id=${quote.id}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View in Admin Panel</a>
  </p>
</body>
</html>
  `;
}
