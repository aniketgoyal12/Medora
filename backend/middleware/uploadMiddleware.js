import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads";

if(!fs.existsSync(uploadDir)){
  fs.mkdirSync(uploadDir, {recursive:true});
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },
}); 

const imageFileFilter = (req,file,cb) =>{
  const allowedImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ]

  if(allowedImageTypes.includes(file.mimetype)){
    cb(null, true);
  }
  else{
    cb( new Error("Only WEBP, JPEG, JPG and PNG images are allowed")),
    false
  }

}

const documentFileFilter = (req,file,cb) =>{
  const allowedDocumentTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ]

  if(allowedDocumentTypes.includes(file.mimetype)){
    cb(null, true);
  }
  else{
    cb( new Error("Only PDF, JPEG, JPG and PNG files are allowed")),
    false
  }
}

export const imageUpload = multer({
  storage,
  fileFilter:imageFileFilter,
  limits:{
    fileSize: 5*1024*1024,
  }
})

export const documentUpload  = multer({
  storage,
  fileFilter:documentFileFilter,
  limits:{
    fileSize:10*1024*1024,
  }
})