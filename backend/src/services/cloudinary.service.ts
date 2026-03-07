import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

type UploadResult = {
  secure_url: string;
  public_id: string;
  thumbnail_url?: string;
  preview_url?: string;
};


// ==============================
// GENERIC BUFFER UPLOAD
// ==============================

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

        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(new Error("Cloudinary upload failed"));
        }

        // generar urls transformadas
        const thumbnail = cloudinary.url(result.public_id, {
          width: 300,
          height: 300,
          crop: "fill",
          resource_type: "image"
        });

        const preview = cloudinary.url(result.public_id, {
          width: 800,
          crop: "limit",
          resource_type: "image"
        });

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          thumbnail_url: thumbnail,
          preview_url: preview
        });

      }
    );

    streamifier.createReadStream(buffer).pipe(stream);

  });

};


// ==============================
// PROFILE PICTURES
// ==============================

export const uploadImage = (buffer: Buffer) => {

  return uploadBuffer(
    buffer,
    "mensajeria/profile_pictures"
  );

};


// ==============================
// CHAT FILES
// ==============================

export const uploadChatFile = (buffer: Buffer) => {

  return uploadBuffer(
    buffer,
    "mensajeria/chat_files"
  );

};


// ==============================
// DELETE FILE
// ==============================

export const deleteImage = async (publicId: string) => {

  if (!publicId) return;

  return cloudinary.uploader.destroy(publicId);

};