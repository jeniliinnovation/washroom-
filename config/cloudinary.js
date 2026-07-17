const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || 'dnmefqcvt',
  api_key: process.env.CLOUDINARY_API_KEY || '762447733112833',
  api_secret: process.env.CLOUDINARY_API_SECRET || '3BD-ry-r2g0IHEUwD_H26ENBTio'
});

async function uploadImage(filePathOrBuffer, filename = 'upload.jpg') {
  try {
    if (typeof filePathOrBuffer === 'string' && fs.existsSync(filePathOrBuffer)) {
      const result = await cloudinary.uploader.upload(filePathOrBuffer, {
        folder: 'washroom_complaints',
        resource_type: 'auto'
      });
      return result.secure_url;
    } else if (Buffer.isBuffer(filePathOrBuffer)) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'washroom_complaints', resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        uploadStream.end(filePathOrBuffer);
      });
    }
  } catch (err) {
    console.warn(`⚠️ Cloudinary upload failed (${err.message}). Saving to local uploads/ directory.`);
  }

  // Fallback: save to local /uploads directory
  const uploadsDir = path.join(__dirname, '../public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const localName = `${Date.now()}_${filename}`;
  const destPath = path.join(uploadsDir, localName);

  if (typeof filePathOrBuffer === 'string' && fs.existsSync(filePathOrBuffer)) {
    fs.copyFileSync(filePathOrBuffer, destPath);
  } else if (Buffer.isBuffer(filePathOrBuffer)) {
    fs.writeFileSync(destPath, filePathOrBuffer);
  }
  return `/uploads/${localName}`;
}

module.exports = { cloudinary, uploadImage };
