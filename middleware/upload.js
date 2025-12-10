const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the storage path for checklist images
const uploadDir = path.join(__dirname, '../public/uploads/checklist-images');

// Ensure the upload directory exists, creating it if it doesn't.
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer's disk storage to save files with unique names
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const { orderId, questionId } = req.params;
        // Create a unique filename using orderId, questionId, and a timestamp to prevent overwrites
        const timestamp = Date.now();
        const newFilename = `${orderId}-${questionId}${path.extname(file.originalname)}`;
        cb(null, newFilename);
    }
});

// Create a file filter to validate extensions
const imageFileFilter = (req, file, cb) => {
    // Regular expression to check for allowed image extensions
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        // If the file is not an image, pass an error to the callback
        const err = new Error('Only image files (jpg, jpeg, png, gif) are allowed!');
        err.status = 400; // Bad Request
        return cb(err, false);
    }
    // If the file is an image, accept it
    cb(null, true);
};

// Initialize multer with storage, size limits, and file filter
const uploadChecklistImage = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB size limit
    },
    fileFilter: imageFileFilter
});

module.exports = uploadChecklistImage;