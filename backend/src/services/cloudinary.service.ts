import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

type UploadResult = {
  secure_url: string;
  public_id: string;
};

const uploadBuffer = (
  buffer: Buffer,
  folder: string
): Promise<UploadResult> => {

  return new Promise((resolve, reject) => {

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        quality: "auto",
        fetch_format: "auto"
      },
      (error, result) => {

        if (error || !result) {
          reject(error);
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id
          });
        }

      }
    );

    streamifier.createReadStream(buffer).pipe(stream);

  });

};



// ==============================
// PROFILE PICTURES
// ==============================

export const uploadImage = (buffer: Buffer) => {

  return uploadBuffer(buffer, "mensajeria/profile_pictures");

};



// ==============================
// CHAT FILES
// ==============================

export const uploadChatFile = (buffer: Buffer) => {

  return uploadBuffer(buffer, "mensajeria/chat_files");

};



// ==============================
// DELETE
// ==============================

export const deleteImage = async (publicId: string) => {

  return cloudinary.uploader.destroy(publicId);

};