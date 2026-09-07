import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Explicitly configure Cloudinary with error checking
const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  console.log('Environment variables check:', {
    CLOUDINARY_CLOUD_NAME: cloudName ? 'Set' : 'Not set',
    CLOUDINARY_API_KEY: apiKey ? 'Set' : 'Not set',
    CLOUDINARY_API_SECRET: apiSecret ? 'Set' : 'Not set',
    GROQ_API_KEY: process.env.GROQ_API_KEY ? 'Set' : 'Not set'
  });

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment variables are not properly set');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });

  return true;
};

// Remove the initialization at module load
// try {
//   configureCloudinary();
//   console.log('Cloudinary configured successfully');
// } catch (error) {
//   console.error('Failed to configure Cloudinary:', error.message);
// }

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.log('No local file path provided');
      return null;
    }

    // Check if file exists
    if (!fs.existsSync(localFilePath)) {
      console.error('File does not exist:', localFilePath);
      return null;
    }

    console.log('Uploading file to Cloudinary:', localFilePath);
    
    // Configure Cloudinary before each upload
    configureCloudinary();
    
    // Verify configuration is loaded
    const config = cloudinary.config();
    console.log('Current Cloudinary config:', {
      cloud_name: config.cloud_name || 'Not set',
      api_key: config.api_key ? 'Set' : 'Not set',
      api_secret: config.api_secret ? 'Set' : 'Not set'
    });

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "kormopulse/profile-pictures",
      transformation: [
        { width: 300, height: 300, crop: "fill", gravity: "face" },
        { quality: "auto" }
      ]
    });

    console.log('Cloudinary upload successful:', {
      url: response.url,
      public_id: response.public_id,
      format: response.format
    });

    // Clean up local file
    try {
      fs.unlinkSync(localFilePath);
      console.log('Local file cleaned up successfully');
    } catch (cleanupError) {
      console.warn('Warning: Could not clean up local file:', cleanupError.message);
    }

    return response;
  } catch (error) {
    console.error('Cloudinary upload error:', {
      message: error.message,
      stack: error.stack,
      filePath: localFilePath
    });

    // Clean up local file even if upload failed
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
        console.log('Local file cleaned up after failed upload');
      }
    } catch (cleanupError) {
      console.warn('Warning: Could not clean up local file after failed upload:', cleanupError.message);
    }

    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      return null;
    }
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
