import { supabase } from './supabase';

/**
 * Deletes a file from Supabase storage given its public URL or path
 */
export async function deleteFileFromStorage(url: string | null | undefined, bucket: string = 'images') {
  if (!url) return;
  
  try {
    // Extract file path from URL
    // Public URL format: https://.../storage/v1/object/public/bucket/path/to/file.ext
    const urlParts = url.split(`/storage/v1/object/public/${bucket}/`);
    if (urlParts.length < 2) return;
    
    const filePath = urlParts[1];
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
      
    if (error) {
      console.error(`Storage cleanup error for ${filePath}:`, error);
    } else {
      console.log(`Successfully deleted ${filePath} from storage.`);
    }
  } catch (err) {
    console.error("Storage cleanup exception:", err);
  }
}
