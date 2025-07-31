const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendFeedbackNotification = async (adminEmail, feedbackData) => {
  const { poemTitle, viewerName, liked, message, rating } = feedbackData;

  const subject = `New Feedback for "${poemTitle}"`;
  const html = `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
      <h2 style="text-align: center; margin-bottom: 30px; color: #fff;">✨ New Poem Feedback ✨</h2>
      
      <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; backdrop-filter: blur(10px);">
        <h3 style="color: #fff; margin-top: 0;">Poem: "${poemTitle}"</h3>
        <p><strong>From:</strong> ${viewerName}</p>
        <p><strong>Reaction:</strong> ${liked ? '❤️ Loved it!' : '💭 Had thoughts'}</p>
        ${rating ? `<p><strong>Rating:</strong> ${'⭐'.repeat(rating)} (${rating}/5)</p>` : ''}
        ${message ? `
          <div style="margin-top: 15px;">
            <strong>Message:</strong>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-top: 10px; font-style: italic;">
              "${message}"
            </div>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 25px;">
          <a href="${process.env.FRONTEND_URL}/admin/feedback" 
             style="background: #ff6b6b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
            View All Feedback
          </a>
        </div>
      </div>
      
      <p style="text-align: center; margin-top: 20px; font-size: 14px; opacity: 0.8;">
        Sent from your Poetic Vault 🌟
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"Poetic Vault" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject,
    html
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendFeedbackNotification
};