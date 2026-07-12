const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
  process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';

let storage;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: { 
      folder: 'campusconnect',
      resource_type: 'auto'
    },
  });
  console.log('☁️ Cloudinary storage configured.');
} else {
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
  });
  console.log('📁 Local storage fallback configured (uploads directory).');
}

const multerUpload = multer({ storage });

const uploadWrapper = {
  single: (fieldName) => {
    const singleMiddleware = multerUpload.single(fieldName);
    return (req, res, next) => {
      singleMiddleware(req, res, (err) => {
        if (err) return next(err);
        if (req.file && !isCloudinaryConfigured) {
          req.file.path = `/uploads/${req.file.filename}`;
        }
        next();
      });
    };
  }
};

module.exports = { cloudinary, upload: uploadWrapper };

