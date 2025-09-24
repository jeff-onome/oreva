import React, { useState, useEffect, useCallback, useMemo } from 'react';
// FIX: Use firebase v9 compat libraries to support v8 syntax for ServerValue.TIMESTAMP.
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { db } from '../../utils/firebase';
import { Category } from '../../types';
import Button from '../../components/Button';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import InputField from '../../components/InputField';

const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (data) {
        return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
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
    return categories.filter(c => 
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

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? This might affect products.')) {
      try {
        await db.ref('categories/' + categoryId).remove();
        showToast('Category deleted successfully', 'success');
        fetchCategories();
      } catch (error) {
          showToast(`Error deleting category`, 'error');
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl md:text-3xl font-bold">Manage Categories</h2>
        <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="relative w-full md:w-64">
                <InputField 
                    id="search-categories"
                    type="text"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    label=''
                    name="search-categories"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>
            <Button variant="secondary" className="flex items-center gap-2" onClick={handleAddCategory}>
              <Plus size={18} /> <span className="hidden sm:inline">Add Category</span>
            </Button>
        </div>
      </div>

      <div className="bg-base overflow-x-auto rounded-lg shadow">
        {loading ? <p className="p-6">Loading categories...</p> : (
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Name</th>
                  <th scope="col" className="px-6 py-3">Slug</th>
                  <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map(category => (
                  <tr key={category.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 font-mono">{category.slug}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleEditCategory(category)} className="p-2 text-primary hover:bg-neutral rounded-full"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteCategory(category.id)} className="p-2 text-red-500 hover:bg-neutral rounded-full"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        )}
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
const CategoryModal: React.FC<{ category: Category | null, onClose: () => void, onSave: () => void }> = ({ category, onClose, onSave }) => {
    const [name, setName] = useState(category?.name || '');
    const [slug, setSlug] = useState(category?.slug || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const generateSlug = (str: string) => {
        return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        setSlug(generateSlug(newName));
    }
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const payload = { name, slug, created_at: firebase.database.ServerValue.TIMESTAMP };

        try {
            if (category) {
                await db.ref('categories/' + category.id).update({ name, slug });
                showToast('Category updated successfully', 'success');
            } else {
                await db.ref('categories').push(payload);
                showToast('Category created successfully', 'success');
            }
            onSave();
            onClose();
        } catch (error) {
            showToast(`Error saving category`, 'error');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-base rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold">{category ? 'Edit Category' : 'Add New Category'}</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <InputField id="name" name="name" label="Category Name" value={name} onChange={handleNameChange} required />
                    <InputField id="slug" name="slug" label="Slug (auto-generated)" value={slug} onChange={(e) => setSlug(e.target.value)} required />
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryManagementPage;