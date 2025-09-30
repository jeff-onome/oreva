import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db, storage } from '../../utils/firebase';
import { supabase } from '../../utils/supabase';
import { Product, Category } from '../../types';
import Button from '../../components/Button';
import { Plus, Edit, Trash2, Loader2, Search, X, Upload } from 'lucide-react';
import { formatNaira } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import InputField from '../../components/InputField';
import Skeleton from '../../components/Skeleton';
import { PLACEHOLDER_IMAGE_URL } from '../../utils/placeholders';

const snapshotToArray = (snapshot: any) => {
  const data = snapshot.val();
  if (data) {
    return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
  }
  return [];
};

const ProductManagementPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const fetchPageData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsSnap, categoriesSnap] = await Promise.all([
        db.ref('products').get(),
        db.ref('categories').get()
      ]);
      setProducts(snapshotToArray(productsSnap) as Product[]);
      setCategories(snapshotToArray(categoriesSnap) as Category[]);
    } catch (error) {
      showToast('Error fetching page data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categories?.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        if (product.images && product.images.length > 0) {
          // Delete from Supabase
          const supabaseImagePaths = product.images
            .filter(url => url.includes('supabase.co'))
            .map(url => {
              const urlParts = url.split('/object/public/images/');
              return urlParts.length > 1 ? urlParts[1] : null;
            })
            .filter(Boolean) as string[];

          if (supabaseImagePaths.length > 0) {
            const { error } = await supabase.storage.from('images').remove(supabaseImagePaths);
            if (error) console.warn(`Could not delete Supabase images:`, error);
          }

          // Delete from Firebase (legacy)
          for (const imageUrl of product.images) {
            if (!imageUrl.includes('firebasestorage.googleapis.com')) continue;
            try {
              const imageRef = storage.refFromURL(imageUrl);
              await imageRef.delete();
            } catch (storageError: any) {
              if (storageError.code !== 'storage/object-not-found') {
                console.warn(`Could not delete Firebase image ${imageUrl}:`, storageError);
              }
            }
          }
        }

        await db.ref('products/' + product.id).remove();
        showToast('Product deleted successfully', 'success');
        fetchPageData();
      } catch (error) {
        showToast(`Error deleting product`, 'error');
        console.error("Delete error:", error);
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl md:text-3xl font-bold">Manage Products</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64 group">
            <InputField
              id="search-products"
              name="search-products"
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
              label=''
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
          </div>
          <Button variant="secondary" className="flex items-center justify-center gap-2 w-full sm:w-auto" onClick={handleAddProduct}>
            <Plus size={18} /> Add New Product
          </Button>
        </div>
      </div>

      <div className="bg-base overflow-x-auto rounded-lg shadow">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Product Name</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Stock</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="bg-white border-b animate-pulse">
                  <th className="px-6 py-4"><Skeleton className="h-4 w-32" /></th>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                  <td className="px-6 py-4 text-right"><Skeleton className="w-8 h-8 rounded-full" /></td>
                </tr>
              ))
            ) : (
              filteredProducts.map(product => (
                <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                  <th className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center gap-3">
                    <img src={product.images?.[0] || PLACEHOLDER_IMAGE_URL} alt={product.name} className="w-10 h-10 rounded-md object-cover" />
                    {product.name}
                  </th>
                  <td className="px-6 py-4">{product.categories?.map(c => c.name).join(', ') || 'N/A'}</td>
                  <td className="px-6 py-4 font-semibold">{formatNaira(product.price)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-800' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEditProduct(product)} className="p-2 text-primary hover:bg-neutral rounded-full"><Edit size={16} /></button>
                    <button onClick={() => handleDeleteProduct(product)} className="p-2 text-red-500 hover:bg-neutral rounded-full"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => setIsModalOpen(false)}
          onSave={fetchPageData}
        />
      )}
    </div>
  );
};

// ---------------------- Product Modal ----------------------
const ProductModal: React.FC<{ product: Product | null, categories: Category[], onClose: () => void, onSave: () => void }> = ({ product, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    sale_price: product?.sale_price || null,
    stock: product?.stock || 0,
    rating: product?.rating || 0,
    reviews: product?.reviews || 0,
    featured: (product as any)?.featured || false,
  });
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(product?.categories || []);
  const [existingImages] = useState<string[]>(product?.images || []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    return () => { previewImages.forEach(url => URL.revokeObjectURL(url)); };
  }, [previewImages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
      return;
    }
    const parsedValue = ['price', 'sale_price', 'stock', 'rating', 'reviews'].includes(name)
      ? (value ? parseFloat(value) : null)
      : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(files);
      previewImages.forEach(url => URL.revokeObjectURL(url));
      setPreviewImages(files.map(file => URL.createObjectURL(file)));
    }
  };

  const handleCategoryToggle = (category: Category) => {
    setSelectedCategories(prev =>
      prev.find(c => c.id === category.id)
        ? prev.filter(c => c.id !== category.id)
        : [...prev, category]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrls = [...existingImages];
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const filePath = `product_images/${Date.now()}-${file.name}`;

          // ✅ Upload to Supabase
          const { data, error } = await supabase.storage
            .from('images')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;

          // ✅ Get public URL
          const { data: publicData } = supabase.storage.from('images').getPublicUrl(filePath);
          if (publicData?.publicUrl) imageUrls.push(publicData.publicUrl);
        }
      }

      const productPayload = {
        ...formData,
        images: imageUrls,
        categories: selectedCategories
      };

      if (product) {
        await db.ref('products/' + product.id).update(productPayload);
        showToast('Product updated successfully', 'success');
      } else {
        await db.ref('products').push(productPayload);
        showToast('Product created successfully', 'success');
      }

      onSave();
      onClose();
    } catch (error) {
      showToast('Failed to save product.', 'error');
      console.error("Product save error: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-base rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-base">
          <h3 className="text-xl font-bold">{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose}><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <InputField id="name" name="name" label="Product Name" value={formData.name} onChange={handleInputChange} required />
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} className="w-full border rounded-md p-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField id="price" name="price" label="Price" type="number" value={String(formData.price)} onChange={handleInputChange} required />
            <InputField id="sale_price" name="sale_price" label="Sale Price (Optional)" type="number" value={String(formData.sale_price ?? '')} onChange={handleInputChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categories</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2 border rounded-md max-h-32 overflow-y-auto">
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={!!selectedCategories.find(c => c.id === cat.id)}
                    onChange={() => handleCategoryToggle(cat)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
          <InputField id="stock" name="stock" label="Stock" type="number" value={String(formData.stock)} onChange={handleInputChange} required />
          <div>
            <label className="block text-sm font-medium mb-1">Product Images</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {existingImages.map((url, i) => <img key={`existing-${i}`} src={url} className="w-16 h-16 object-cover rounded" />)}
              {previewImages.map((url, i) => <img key={`preview-${i}`} src={url} className="w-16 h-16 object-cover rounded" />)}
            </div>
            <label htmlFor="image-upload" className="w-full cursor-pointer border p-4 rounded-md flex items-center gap-2">
              <Upload size={16} />
              <span>{imageFiles.length > 0 ? `${imageFiles.length} files selected` : 'Upload Images'}</span>
            </label>
            <input type="file" id="image-upload" multiple onChange={handleFileChange} className="hidden" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="featured" name="featured" checked={formData.featured} onChange={handleInputChange} />
            <label htmlFor="featured">Feature on Homepage</label>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductManagementPage;
