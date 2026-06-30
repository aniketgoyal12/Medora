import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const uploadToCloudinary = async (filePath, folder ="Medora") => {
  try {
    const result = await cloudinary.uploader.upload(filePath,{
        folder,
        resource_type: "auto"
    })

    fs.unlinkSync(filePath);
    return result;
  } catch (err) {
    throw err ;
  }finally{
    try{
      if(fs.existsSync(filePath)){
        fs.unlinkSync(filePath);
      }
    }catch(deleteError){
      "Failed to delete temporary file:"
      deleteError.message;
    }
  }
};

export default uploadToCloudinary;