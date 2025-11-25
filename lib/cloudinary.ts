import { CLOUDINARY_CONFIG } from "../constants";

export const uploadToCloudinary = async (file: File | Blob, type: 'image' | 'video' | 'raw' = 'image'): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.upload_preset);

  const resourceType = type === 'raw' ? 'raw' : (file.type.startsWith('image/') ? 'image' : 'video');
  
  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Cloudinary upload failed');
  }

  const data = await response.json();
  return data.secure_url;
};
