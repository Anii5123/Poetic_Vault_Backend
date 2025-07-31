const QRCode = require('qrcode');

const generateQRCode = async (text, options = {}) => {
  const defaultOptions = {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    quality: 0.92,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    width: 256
  };

  const qrOptions = { ...defaultOptions, ...options };

  try {
    const qrCode = await QRCode.toDataURL(text, qrOptions);
    return qrCode;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

const generateQRCodeBuffer = async (text, options = {}) => {
  try {
    const buffer = await QRCode.toBuffer(text, options);
    return buffer;
  } catch (error) {
    console.error('QR Code buffer generation error:', error);
    throw new Error('Failed to generate QR code buffer');
  }
};

module.exports = {
  generateQRCode,
  generateQRCodeBuffer
};