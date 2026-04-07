// configure cloudinary based on the following credentials CLOUDINARY_CLOUD_NAME= , CLOUDINARY_API_KEY=, CLOUDINARY_API_SECRET
// these credentials are stored in the .env file and should be accessed using process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET
// the cloudinary configuration should be exported as a module so that it can be used in other parts of the application
// the cloudinary configuration should be set up to use the cloudinary storage engine for multer, so that when a file is uploaded using multer, it is automatically uploaded to cloudinary and the URL of the uploaded file is returned in the response
// the cloudinary configuration should also include a function to delete a file from cloudinary based on its public ID, which can be used when a file is deleted from the application to also delete it from cloudinary
// this is the expected api responce structure after aploading the file to cloudinary which can be either an image or a video

// {
//   "public_id": "gotjephlnz2jgiu20zni",
//   "format": "jpg",
//   "resource_type": "image",
//   "created_at": "2024-06-25T09:25:44Z",
//   "secure_url": "https://res.cloudinary.com/cld-docs/image/upload/v1719307544/gotjephlnz2jgiu20zni.jpg",
// }
// this is what we expect from the responce --"public_id":uniquely indentify for operations like delete , modify
// secure_url -- used to access the image /video from the cluodinary to our serve
// handle errors using logger function , 
// create sepaarate function for updating an image , deleting an image , creating an image
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "church_officials",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "mp4", "mov", "avi"],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      return file.fieldname + "-" + uniqueSuffix;
    },
  },
});

export default cloudinary;


