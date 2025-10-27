import {
  v2 as cloudinary,
  
} from "cloudinary";

import dotenv from "dotenv";
dotenv.config();

    
export const uploadInCloudinary = async ({
  data,
  folder,
  isUpload = true,
  publicId =null,
  resourceType = "image",
  
}:any) => {
  // Configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  if (isUpload) {
    try {
      const options:any = {
        folder: folder,
        quality: "auto",
        resource_type: "auto"  // Type assertion here
      };
      return await cloudinary.uploader.upload(data, options);
    } catch (error) {
      console.log("Some error occurred during the file upload to Cloudinary");
      console.log("Error in Cloudinary is:", error);
      throw error; // Rethrow the error after logging
    }
  } else {
    try {
      if (!publicId) {
        throw new Error("Public ID is required for deletion");
      }
      return await cloudinary.uploader.destroy(publicId,{
        resource_type:resourceType
      });
    } catch (error:any) {
      console.log(
        "Some error occurred during the file deletion from Cloudinary"
      );
      console.log("Error in Cloudinary is:", (error).message);
      throw error; // Rethrow the error after logging
    }
  }
};