
import { useState } from 'react';
import { uxWatchSupabase } from '../../../supabase/uxWatch_client';

export const useUxWatchMediaUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadMedia = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Use a specific bucket for watch party
      const bucketName = 'watch-party';

      const { error: uploadError } = await uxWatchSupabase.storage
        .from(bucketName) 
        .upload(filePath, file);

      if (uploadError) {
          // Handle missing bucket specifically
          if (uploadError.message.includes('not found') || (uploadError as any).statusCode === 404) {
              throw new Error(`Storage bucket '${bucketName}' not found. Please go to Supabase Dashboard > Storage and create a public bucket named '${bucketName}'.`);
          }
          throw uploadError;
      }

      const { data } = uxWatchSupabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message);
      alert(`Upload Error: ${err.message}`); // Alert user directly
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadMedia, uploading, error };
};
