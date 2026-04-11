"use client";
import { useState, useEffect, useCallback } from 'react';
import { produce } from 'immer';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { useToast } from '../context/ToastContext';

export const useDashboard = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { content, saveAllContent } = useContent();
  const { showToast } = useToast();
  const [localContent, setLocalContent] = useState<any>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ path: (string | number)[], isOpen: boolean }>({ path: [], isOpen: false });

  // Initialize local content with stable IDs
  useEffect(() => {
    if (content && Object.keys(content).length > 0 && !hasInitialized) {
      const next = JSON.parse(JSON.stringify(content));
      
      const ensureIds = (obj: any, prefix: string = 'item'): any => {
        if (Array.isArray(obj)) {
          return obj.map((item: any, i: number) => {
            if (item && typeof item === 'object' && !Array.isArray(item)) {
              const newItem = { ...item };
              if (!newItem.id) {
                newItem.id = `${prefix}-${i}-${Math.random().toString(36).substr(2, 9)}`;
              }
              Object.keys(newItem).forEach(key => {
                newItem[key] = ensureIds(newItem[key], `${prefix}-${key}`);
              });
              return newItem;
            } else if (typeof item === 'string' && prefix.includes('gallery')) {
              return { id: `gallery-${i}-${Math.random().toString(36).substr(2, 9)}`, url: item };
            }
            return item;
          });
        } else if (obj && typeof obj === 'object') {
          const newObj = { ...obj };
          Object.keys(newObj).forEach(key => {
            newObj[key] = ensureIds(newObj[key], `${prefix}-${key}`);
          });
          return newObj;
        }
        return obj;
      };

      const initialized = ensureIds(next, 'root');
      setLocalContent(initialized);
      setHasInitialized(true);
    }
  }, [content, hasInitialized]);

  const updateFieldByPath = useCallback((path: (string | number)[], value: any) => {
    setLocalContent((state: any) => {
      const newState = produce(state, (draft: any) => {
        let current = draft;
        for (let i = 0; i < path.length - 1; i++) {
          const key = path[i];
          if (!current[key]) {
            current[key] = typeof path[i+1] === 'number' ? [] : {};
          }
          current = current[key];
        }
        current[path[path.length - 1]] = value;
      });
      return newState;
    });
  }, []);

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const dataToSave = produce(localContent, (draft: any) => {
        if (draft.gallery && Array.isArray(draft.gallery.images)) {
          draft.gallery.images = draft.gallery.images.map((item: any) => 
            (item && typeof item === 'object' && 'url' in item) ? item.url : item
          );
        }
      });

      await saveAllContent(dataToSave);
      setSaveSuccess(true);
      showToast("Changes saved successfully!", "success");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving content:", error);
      showToast("Failed to save changes.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, path: (string | number)[]) => {
    if (!isSupabaseConfigured) {
      showToast("Database is not configured. File upload is disabled.", "error");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidExtension = ['jpg', 'jpeg', 'png', 'pdf'].includes(fileExtension || '');

    if (!validTypes.includes(file.type) && !isValidExtension) {
      showToast("Only .jpg, .png and .pdf formats are allowed.", "error");
      return;
    }

    const uploadId = path.join('-');
    setUploading(uploadId);

    try {
      const extension = file.name.split('.').pop();
      const baseName = file.name.split('.').slice(0, -1).join('.');
      const sanitizedBase = baseName
        .replace(/[^\x00-\x7F]/g, "")
        .replace(/[^a-z0-9]/gi, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      
      const finalBase = sanitizedBase || "file";
      const fileName = `${Date.now()}-${finalBase}.${extension}`;

      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      updateFieldByPath(path, publicUrl);
      showToast("File uploaded successfully!", "success");
    } catch (error) {
      console.error("Upload error:", error);
      showToast("Failed to upload file.", "error");
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteFile = (path: (string | number)[]) => {
    updateFieldByPath(path, "");
    showToast("File removed from content. Save to apply changes.", "info");
  };

  const requestDeleteFile = (path: (string | number)[]) => {
    setConfirmDelete({ path, isOpen: true });
  };

  const resetLocalContent = useCallback(() => {
    if (content && Object.keys(content).length > 0) {
      const next = JSON.parse(JSON.stringify(content));
      
      const ensureIds = (obj: any, prefix: string = 'item'): any => {
        if (Array.isArray(obj)) {
          return obj.map((item: any, i: number) => {
            if (item && typeof item === 'object' && !Array.isArray(item)) {
              const newItem = { ...item };
              if (!newItem.id) {
                newItem.id = `${prefix}-${i}-${Math.random().toString(36).substr(2, 9)}`;
              }
              Object.keys(newItem).forEach(key => {
                newItem[key] = ensureIds(newItem[key], `${prefix}-${key}`);
              });
              return newItem;
            } else if (typeof item === 'string' && prefix.includes('gallery')) {
              return { id: `gallery-${i}-${Math.random().toString(36).substr(2, 9)}`, url: item };
            }
            return item;
          });
        } else if (obj && typeof obj === 'object') {
          const newObj = { ...obj };
          Object.keys(newObj).forEach(key => {
            newObj[key] = ensureIds(newObj[key], `${prefix}-${key}`);
          });
          return newObj;
        }
        return obj;
      };

      setLocalContent(ensureIds(next, 'root'));
    }
  }, [content]);

  return {
    isAdmin,
    authLoading,
    localContent,
    setLocalContent,
    saving,
    saveSuccess,
    uploading,
    handleSave,
    handleFileUpload,
    handleDeleteFile,
    requestDeleteFile,
    confirmDelete,
    setConfirmDelete,
    updateFieldByPath,
    resetLocalContent,
    isSupabaseConfigured
  };
};
