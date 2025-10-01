import { supabase } from './supabase';

export const supabaseStorage = {
  // Upload product image
  uploadProductImage: async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `product_images/${fileName}`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    return publicUrl;
  },

  // Upload hero slide image
  uploadHeroImage: async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `hero_slides/${fileName}`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    return publicUrl;
  },

  // Upload team member image
  uploadTeamImage: async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `team_members/${fileName}`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    return publicUrl;
  },

  // Delete image
  deleteImage: async (filePath: string): Promise<void> => {
    // Extract the path from URL if full URL is provided
    const path = filePath.includes('/object/public/') 
      ? filePath.split('/object/public/')[1]
      : filePath;

    const { error } = await supabase.storage
      .from('images')
      .remove([path]);

    if (error) {
      console.warn('Failed to delete image:', error);
    }
  }
};