import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Firebase still used for Realtime DB + ServerValue.TIMESTAMP
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { db } from '../../utils/firebase';
import { supabase } from '../../utils/supabase';
import { Category } from '../../types';
import Button from '../../components/Button';
import { Plus, Edit, Trash2, X, Search, Upload, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import InputField from '../../components/InputField';
import Skeleton from '../../components/Skeleton';
import { PLACEHOLDER_IMAGE_URL } from '../../utils/placeholders';

const snapshotToArray = (snapshot: any) => {
  const data = snapshot.val();
  if (data) {
    return Object.entries(data).map(([id, value]) => ({
      ...(value as object),
      id,
    }));
  }
  return [];
};

const CategoryManagementPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const q = db.ref('categories').orderByChild('name');
      const snapshot = await q.get();
      setCategories(snapshotToArray(snapshot) as Category[]);
    } catch (error) {
      showToast('Error fetching categories', 'error');
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = useMemo(() => {
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (
      window.confirm(
        'Are you sure you want to delete this category? This might affect products.'
      )
    ) {
      try {
        // ✅ Delete Supabase image if it exists
        if (category.imageUrl?.includes('supabase.co')) {
          const urlParts = category.imageUrl.split('/images/');
          const imagePath = urlParts.length > 1 ? urlParts[1] : null;
          if (imagePath) {
            await supabase.storage.from('images').remove([imagePath]);
          }
        }

        await db.ref('categories/' + category.id).remove();
        showToast('Category deleted successfully', 'success');
        fetchCategories();
      } catch (error) {
        showToast(`Error deleting category`, 'error');
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl md:text-3xl font-bold">Manage Categories</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64 group">
            <InputField
              id="search-categories"
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
              label=""
              name="search-categories"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
              size={20}
            />
          </div>
          <Button
            variant="secondary"
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
            onClick={handleAddCategory}
          >
            <Plus size={18} /> Add New Category
          </Button>
        </div>
      </div>

      <div className="bg-base overflow-x-auto rounded-lg shadow">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                Name
              </th>
              <th scope="col" className="px-6 py-3">
                Slug
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="bg-white border-b animate-pulse">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-md" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-40" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="w-8 h-8 rounded-full" />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              filteredCategories.map((category) => (
                <tr
                  key={category.id}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                    <img
                      src={category.imageUrl || PLACEHOLDER_IMAGE_URL}
                      alt={category.name}
                      className="w-10 h-10 rounded-md object-cover bg-neutral"
                    />
                    {category.name}
                  </td>
                  <td className="px-6 py-4 font-mono">{category.slug}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-2 text-primary hover:bg-neutral rounded-full"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="p-2 text-red-500 hover:bg-neutral rounded-full"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setIsModalOpen(false)}
          onSave={fetchCategories}
        />
      )}
    </div>
  );
};

// Category Modal Form Component
const CategoryModal: React.FC<{
  category: Category | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ category, onClose, onSave }) => {
  const [name, setName] = useState(category?.name || '');
  const [slug, setSlug] = useState(category?.slug || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(category?.imageUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const generateSlug = (str: string) => {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(generateSlug(newName));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file as Blob));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let finalImageUrl = category?.imageUrl || '';

    try {
      if (imageFile) {
        const filePath = `category_images/${Date.now()}-${imageFile.name}`;
        const { data, error } = await supabase.storage
          .from('images')
          .upload(filePath, imageFile);

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from('images').getPublicUrl(data.path);
        finalImageUrl = publicUrl;
      }

      if (category) {
        const updatePayload = { name, slug, imageUrl: finalImageUrl };
        await db.ref('categories/' + category.id).update(updatePayload);
        showToast('Category updated successfully', 'success');
      } else {
        const createPayload = {
          name,
          slug,
          imageUrl: finalImageUrl,
          created_at: firebase.database.ServerValue.TIMESTAMP,
        };
        await db.ref('categories').push(createPayload);
        showToast('Category created successfully', 'success');
      }
      onSave();
      onClose();
    } catch (error) {
      showToast(`Error saving category`, 'error');
      console.error(error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-base rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">
            {category ? 'Edit Category' : 'Add New Category'}
          </h3>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <InputField
            id="name"
            name="name"
            label="Category Name"
            value={name}
            onChange={handleNameChange}
            required
          />
          <InputField
            id="slug"
            name="slug"
            label="Slug (auto-generated)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Category Image
            </label>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Category preview"
                className="w-full h-32 object-cover rounded bg-neutral mb-2"
              />
            )}
            <input
              type="file"
              id="category-image"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <label
              htmlFor="category-image"
              className="font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform transform active:scale-95 duration-200 ease-in-out bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary py-1 px-3 text-sm w-full cursor-pointer flex items-center justify-center gap-2"
            >
              <Upload size={14} />{' '}
              {imageUrl ? 'Change Image' : 'Upload Image'}
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryManagementPage;
