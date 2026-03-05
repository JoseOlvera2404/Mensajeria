import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

export const uploadImage = (
  buffer: Buffer
): Promise<{ secure_url: string; public_id: string }> => {

  return new Promise((resolve, reject) => {

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "mensajeria",
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

export const deleteImage = async (publicId: string) => {

  return cloudinary.uploader.destroy(publicId);

};