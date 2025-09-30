import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../utils/firebase';
import { supabase } from '../../utils/supabase';
import { SiteSettings, Product, HeroSlide, TeamMember } from '../../types';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import { useToast } from '../../context/ToastContext';
import { Loader2, Trash2, Upload } from 'lucide-react';
import Skeleton from '../../components/Skeleton';
import { PLACEHOLDER_IMAGE_URL } from '../../utils/placeholders';

const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (data) {
        return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
    }
    return [];
};

// Configuration constants
const STORAGE_CONFIG = {
    BUCKET_NAME: 'images',
    HERO_SLIDES_PATH: 'site_images/hero-slider',
    TEAM_IMAGES_PATH: 'site_images/team',
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
};

const SiteSettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<Partial<SiteSettings>>({
        flash_sale: { active: false, title: '', productId: '', endDate: '' },
        about_page: { title: '', subtitle: '', missionTitle: '', missionContent: '' },
        hero_slides: [],
        team_members: [],
        site_name: { name: 'ORESKY' },
        contact_info: { email: '', phone: '', address: '', hours: '' },
        social_links: { facebook: '', whatsapp: '', instagram: '', twitter: '' },
    });
    const [products, setProducts] = useState<Pick<Product, 'id' | 'name'>[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
    const { showToast } = useToast();
    
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

    const fetchPageData = useCallback(async () => {
        setLoading(true);
        try {
            const settingsSnap = await db.ref('site_settings').get();
            if (settingsSnap.exists()) {
                const settingsObject = settingsSnap.val();
                setSettings(settingsObject);
                setHeroSlides(settingsObject.hero_slides || []);
                setTeamMembers(settingsObject.team_members || []);
            }
            
            const productsSnap = await db.ref('products').get();
            setProducts(snapshotToArray(productsSnap).map((p: any) => ({ id: p.id, name: p.name })));

        } catch(error) {
            showToast('Could not load site settings.', 'error');
        }
        setLoading(false);
    }, [showToast]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleSettingChange = (category: keyof SiteSettings, key: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...(prev[category] as object || {}),
                [key]: value,
            },
        }));
    };
    
    const handleSave = async (key: keyof SiteSettings, dataToSave: any) => {
        setIsSaving(key);
        try {
            await db.ref('site_settings').update({ [key]: dataToSave });
            showToast(`${key.replace('_',' ')} settings saved successfully!`, 'success');
        } catch (error: any) {
            showToast(`Error saving ${key.replace('_',' ')}: ${error.message}`, 'error');
        }
        setIsSaving(null);
    };

    // Enhanced file upload utility function :cite[1]
    const uploadFileToSupabase = async (file: File, filePath: string): Promise<string> => {
        // File validation
        if (!STORAGE_CONFIG.ALLOWED_TYPES.includes(file.type)) {
            throw new Error(`File type not allowed. Allowed types: ${STORAGE_CONFIG.ALLOWED_TYPES.join(', ')}`);
        }

        if (file.size > STORAGE_CONFIG.MAX_FILE_SIZE) {
            throw new Error(`File too large. Maximum size: ${STORAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
        }

        // Upload file to Supabase Storage :cite[1]:cite[9]
        const { data, error } = await supabase.storage
            .from(STORAGE_CONFIG.BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            throw new Error(`Upload failed: ${error.message}`);
        }

        // Get public URL :cite[3]:cite[9]
        const { data: { publicUrl } } = supabase.storage
            .from(STORAGE_CONFIG.BUCKET_NAME)
            .getPublicUrl(data.path);

        // Verify the URL structure :cite[8]
        if (!publicUrl.includes('/object/')) {
            console.warn('Unexpected URL structure:', publicUrl);
        }

        return publicUrl;
    };
    
    // --- Hero Slide Handlers ---
    const handleSlideChange = (index: number, field: keyof HeroSlide, value: string) => {
        const newSlides = [...heroSlides];
        newSlides[index] = { ...newSlides[index], [field]: value };
        setHeroSlides(newSlides);
    };

    const handleSlideImageUpload = async (index: number, file: File) => {
        if (!file) return;
        
        const uploadKey = `slide-${index}`;
        
        // Create a temporary blob URL for instant preview
        const tempUrl = URL.createObjectURL(file);
        handleSlideChange(index, 'imageUrl', tempUrl);

        const filePath = `${STORAGE_CONFIG.HERO_SLIDES_PATH}/${Date.now()}-${file.name}`;
        
        try {
            setUploadProgress(prev => ({ ...prev, [uploadKey]: 0 }));

            const publicUrl = await uploadFileToSupabase(file, filePath);
            
            // Update with the permanent URL
            handleSlideChange(index, 'imageUrl', publicUrl);
            showToast('Hero image uploaded successfully!', 'success');
            
        } catch (uploadError: any) {
            console.error('Upload error:', uploadError);
            showToast(`Image upload failed: ${uploadError.message}`, 'error');
            // Revert to previous image URL or placeholder
            handleSlideChange(index, 'imageUrl', heroSlides[index]?.imageUrl || PLACEHOLDER_IMAGE_URL);
        } finally {
            URL.revokeObjectURL(tempUrl);
            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[uploadKey];
                return newProgress;
            });
        }
    };

    const addSlide = () => {
        setHeroSlides([...heroSlides, { imageUrl: '', title: '', subtitle: '' }]);
    };

    const removeSlide = async (index: number) => {
        const slide = heroSlides[index];
        if (slide.imageUrl && slide.imageUrl !== PLACEHOLDER_IMAGE_URL) {
            // Extract file path from URL for potential cleanup
            try {
                // Optional: Add logic to delete file from storage when slide is removed
                // const filePath = extractFilePathFromUrl(slide.imageUrl);
                // await supabase.storage.from(STORAGE_CONFIG.BUCKET_NAME).remove([filePath]);
            } catch (error) {
                console.warn('Failed to delete image from storage:', error);
            }
        }
        setHeroSlides(heroSlides.filter((_, i) => i !== index));
    };

    // --- Team Member Handlers ---
    const handleTeamMemberChange = (index: number, field: keyof TeamMember | 'social.twitter' | 'social.whatsapp' | 'social.instagram', value: string) => {
        const newMembers = [...teamMembers];
        const member = { ...newMembers[index] };

        if (field.startsWith('social.')) {
            const socialField = field.split('.')[1] as 'twitter' | 'whatsapp' | 'instagram';
            member.social = { ...member.social, [socialField]: value };
        } else {
            (member as any)[field] = value;
        }
        newMembers[index] = member;
        setTeamMembers(newMembers);
    };
    
    const handleTeamMemberImageUpload = async (index: number, file: File) => {
        if (!file) return;

        const uploadKey = `team-${index}`;
        
        // Create a temporary blob URL for instant preview
        const tempUrl = URL.createObjectURL(file);
        handleTeamMemberChange(index, 'imageUrl', tempUrl);

        const filePath = `${STORAGE_CONFIG.TEAM_IMAGES_PATH}/${Date.now()}-${file.name}`;
        
        try {
            setUploadProgress(prev => ({ ...prev, [uploadKey]: 0 }));

            const publicUrl = await uploadFileToSupabase(file, filePath);

            handleTeamMemberChange(index, 'imageUrl', publicUrl);
            showToast('Team member image uploaded successfully!', 'success');
            
        } catch (uploadError: any) {
            console.error('Upload error:', uploadError);
            showToast(`Image upload failed: ${uploadError.message}`, 'error');
            // Revert to previous image URL or placeholder
            handleTeamMemberChange(index, 'imageUrl', teamMembers[index]?.imageUrl || PLACEHOLDER_IMAGE_URL);
        } finally {
            URL.revokeObjectURL(tempUrl);
            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[uploadKey];
                return newProgress;
            });
        }
    };

    const addTeamMember = () => {
        setTeamMembers([...teamMembers, { 
            name: '', 
            role: '', 
            imageUrl: '', 
            bio: '', 
            social: { twitter: '#', whatsapp: '#', instagram: '#' } 
        }]);
    };

    const removeTeamMember = async (index: number) => {
        const member = teamMembers[index];
        if (member.imageUrl && member.imageUrl !== PLACEHOLDER_IMAGE_URL) {
            // Optional: Add storage cleanup logic here
        }
        setTeamMembers(teamMembers.filter((_, i) => i !== index));
    };

    // Utility function to check if URL is from Supabase storage
    const isSupabaseUrl = (url: string): boolean => {
        return url.includes('supabase.co/storage/v1/object/public/');
    };

    if (loading) return (
        <div className="space-y-8 animate-pulse">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
        </div>
    );

    return (
        <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Site Settings</h2>
            <div className="space-y-8">

                 {/* General Settings */}
                <div className="p-6 border rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">General Settings</h3>
                    <div className="space-y-4">
                        <InputField 
                            id="site-name" 
                            label="Site Name" 
                            type="text" 
                            value={settings.site_name?.name || ''}
                            onChange={(e) => handleSettingChange('site_name', 'name', e.target.value)}
                        />
                    </div>
                    <div className="text-right mt-4">
                        <Button onClick={() => handleSave('site_name', settings.site_name)} disabled={isSaving === 'site_name'}>
                            {isSaving === 'site_name' ? <Loader2 className="animate-spin"/> : 'Save General Settings'}
                        </Button>
                    </div>
                </div>

                {/* Homepage Hero Slider */}
                 <div className="p-6 border rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">Homepage Hero Slider</h3>
                    <div className="space-y-4">
                        {heroSlides.map((slide, index) => (
                            <div key={index} className="p-4 border rounded-md grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                                <div className="space-y-2">
                                    <img 
                                        src={slide.imageUrl || PLACEHOLDER_IMAGE_URL} 
                                        alt="Slide preview" 
                                        className="w-full h-24 object-cover rounded bg-neutral"
                                        onError={(e) => {
                                            e.currentTarget.src = PLACEHOLDER_IMAGE_URL;
                                        }}
                                    />
                                    <input 
                                        type="file" 
                                        id={`slide-image-${index}`} 
                                        className="hidden" 
                                        accept="image/png, image/jpeg, image/webp"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                handleSlideImageUpload(index, e.target.files[0]);
                                            }
                                            e.target.value = ''; // Reset input
                                        }} 
                                    />
                                    <label 
                                        htmlFor={`slide-image-${index}`} 
                                        className="font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform transform active:scale-95 duration-200 ease-in-out bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary py-1 px-3 text-sm w-full cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        {uploadProgress[`slide-${index}`] !== undefined ? (
                                            <Loader2 className="animate-spin" size={14} />
                                        ) : (
                                            <Upload size={14} />
                                        )}
                                        {uploadProgress[`slide-${index}`] !== undefined ? 'Uploading...' : 'Change Image'}
                                    </label>
                                    {slide.imageUrl && isSupabaseUrl(slide.imageUrl) && (
                                        <p className="text-xs text-green-600">✓ Stored in Supabase</p>
                                    )}
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <InputField 
                                        label="Title" 
                                        id={`slide_title_${index}`} 
                                        value={slide.title} 
                                        onChange={(e) => handleSlideChange(index, 'title', e.target.value)} 
                                    />
                                    <InputField 
                                        label="Subtitle" 
                                        id={`slide_subtitle_${index}`} 
                                        value={slide.subtitle} 
                                        onChange={(e) => handleSlideChange(index, 'subtitle', e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={() => removeSlide(index)} 
                                    className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 rounded-full"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4">
                        <Button type="button" variant="ghost" onClick={addSlide}>+ Add Slide</Button>
                    </div>
                    <div className="text-right mt-4">
                        <Button onClick={() => handleSave('hero_slides', heroSlides)} disabled={isSaving === 'hero_slides'}>
                            {isSaving === 'hero_slides' ? <Loader2 className="animate-spin"/> : 'Save Slider Settings'}
                        </Button>
                    </div>
                </div>

                {/* Flash Sale Settings */}
                <div className="p-6 border rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">Homepage Flash Sale</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <span className="font-medium">Enable Flash Sale</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={settings.flash_sale?.active || false} 
                                    onChange={(e) => handleSettingChange('flash_sale', 'active', e.target.checked)}
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                        <InputField 
                            id="flash-sale-title" 
                            label="Sale Title" 
                            type="text" 
                            value={settings.flash_sale?.title || ''}
                            onChange={(e) => handleSettingChange('flash_sale', 'title', e.target.value)}
                        />
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Featured Product</label>
                            <select 
                                value={settings.flash_sale?.productId || ''} 
                                onChange={(e) => handleSettingChange('flash_sale', 'productId', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary sm:text-sm"
                            >
                                <option value="">Select a product</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <InputField 
                            id="flash-sale-end-date" 
                            label="Sale End Date" 
                            type="datetime-local" 
                            value={settings.flash_sale?.endDate ? settings.flash_sale.endDate.slice(0, 16) : ''}
                            onChange={(e) => handleSettingChange('flash_sale', 'endDate', new Date(e.target.value).toISOString())}
                        />
                    </div>
                    <div className="text-right mt-4">
                        <Button onClick={() => handleSave('flash_sale', settings.flash_sale)} disabled={isSaving === 'flash_sale'}>
                            {isSaving  === 'flash_sale' ? <Loader2 className="animate-spin"/> : 'Save Flash Sale Settings'}
                        </Button>
                    </div>
                </div>

                {/* About Page Settings */}
                <div className="p-6 border rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">About Page Content</h3>
                    <div className="space-y-4">
                        <InputField 
                            id="about-title" 
                            label="Page Title" 
                            type="text" 
                            value={settings.about_page?.title || ''}
                            onChange={(e) => handleSettingChange('about_page', 'title', e.target.value)}
                        />
                        <InputField 
                            id="about-subtitle" 
                            label="Page Subtitle" 
                            type="text" 
                            value={settings.about_page?.subtitle || ''}
                            onChange={(e) => handleSettingChange('about_page', 'subtitle', e.target.value)}
                        />
                         <InputField 
                            id="about-mission-title" 
                            label="Mission Title" 
                            type="text" 
                            value={settings.about_page?.missionTitle || ''}
                            onChange={(e) => handleSettingChange('about_page', 'missionTitle', e.target.value)}
                        />
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Mission Content</label>
                            <textarea
                                rows={4}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary sm:text-sm"
                                value={settings.about_page?.missionContent || ''}
                                onChange={(e) => handleSettingChange('about_page', 'missionContent', e.target.value)}
                            />
                        </div>
                    </div>
                     <div className="text-right mt-4">
                        <Button onClick={() => handleSave('about_page', settings.about_page)} disabled={isSaving === 'about_page'}>
                             {isSaving === 'about_page' ? <Loader2 className="animate-spin"/> : 'Save About Page Content'}
                        </Button>
                    </div>
                </div>

                {/* Meet the Team Settings */}
                <div className="p-6 border rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">Meet the Team</h3>
                     <div className="space-y-4">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="p-4 border rounded-md grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                                <div className="space-y-2">
                                    <img 
                                        src={member.imageUrl || PLACEHOLDER_IMAGE_URL} 
                                        alt="Team member preview" 
                                        className="w-full h-32 object-cover rounded bg-neutral"
                                        onError={(e) => {
                                            e.currentTarget.src = PLACEHOLDER_IMAGE_URL;
                                        }}
                                    />
                                    <input 
                                        type="file" 
                                        id={`team-image-${index}`} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                handleTeamMemberImageUpload(index, e.target.files[0]);
                                            }
                                            e.target.value = ''; // Reset input
                                        }} 
                                    />
                                    <label 
                                        htmlFor={`team-image-${index}`} 
                                        className="font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform transform active:scale-95 duration-200 ease-in-out bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary py-1 px-3 text-sm w-full cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        {uploadProgress[`team-${index}`] !== undefined ? (
                                            <Loader2 className="animate-spin" size={14} />
                                        ) : (
                                            <Upload size={14} />
                                        )}
                                        {uploadProgress[`team-${index}`] !== undefined ? 'Uploading...' : 'Change Image'}
                                    </label>
                                    {member.imageUrl && isSupabaseUrl(member.imageUrl) && (
                                        <p className="text-xs text-green-600">✓ Stored in Supabase</p>
                                    )}
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <InputField label="Name" id={`team_name_${index}`} value={member.name} onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)} />
                                    <InputField label="Role" id={`team_role_${index}`} value={member.role} onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)} />
                                    <InputField label="Bio" id={`team_bio_${index}`} value={member.bio} onChange={(e) => handleTeamMemberChange(index, 'bio', e.target.value)} />
                                    <InputField label="Twitter URL" id={`team_twitter_${index}`} value={member.social?.twitter || ''} onChange={(e) => handleTeamMemberChange(index, 'social.twitter', e.target.value)} />
                                    <InputField label="WhatsApp URL" id={`team_whatsapp_${index}`} value={member.social?.whatsapp || ''} onChange={(e) => handleTeamMemberChange(index, 'social.whatsapp', e.target.value)} />
                                    <InputField label="Instagram URL" id={`team_instagram_${index}`} value={member.social?.instagram || ''} onChange={(e) => handleTeamMemberChange(index, 'social.instagram', e.target.value)} />
                                </div>
                                <button 
                                    onClick={() => removeTeamMember(index)} 
                                    className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 rounded-full"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4">
                        <Button type="button" variant="ghost" onClick={addTeamMember}>+ Add Team Member</Button>
                    </div>
                    <div className="text-right mt-4">
                        <Button onClick={() => handleSave('team_members', teamMembers)} disabled={isSaving === 'team_members'}>
                            {isSaving === 'team_members' ? <Loader2 className="animate-spin"/> : 'Save Team Settings'}
                        </Button>
                    </div>
                </div>
                
                {/* Contact Info Settings */}
                <div className="p-6 border rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                    <div className="space-y-4">
                        <InputField 
                            id="contact-email" 
                            label="Contact Email" 
                            type="email" 
                            value={settings.contact_info?.email || ''}
                            onChange={(e) => handleSettingChange('contact_info', 'email', e.target.value)}
                        />
                        <InputField 
                            id="contact-phone" 
                            label="Contact Phone" 
                            type="tel" 
                            value={settings.contact_info?.phone || ''}
                            onChange={(e) => handleSettingChange('contact_info', 'phone', e.target.value)}
                        />
                        <InputField 
                            id="contact-address" 
                            label="Address" 
                            type="text" 
                            value={settings.contact_info?.address || ''}
                            onChange={(e) => handleSettingChange('contact_info', 'address', e.target.value)}
                        />
                        <InputField 
                            id="contact-hours" 
                            label="Business Hours" 
                            type="text" 
                            value={settings.contact_info?.hours || ''}
                            onChange={(e) => handleSettingChange('contact_info', 'hours', e.target.value)}
                        />
                    </div>
                     <div className="text-right mt-4">
                        <Button onClick={() => handleSave('contact_info', settings.contact_info)} disabled={isSaving === 'contact_info'}>
                             {isSaving === 'contact_info' ? <Loader2 className="animate-spin"/> : 'Save Contact Info'}
                        </Button>
                    </div>
                </div>

                 {/* Social Media Settings */}
                <div className="p-6 border rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">Social Media Links</h3>
                    <div className="space-y-4">
                        <InputField 
                            id="social-facebook" 
                            label="Facebook URL" 
                            type="url" 
                            value={settings.social_links?.facebook || ''}
                            onChange={(e) => handleSettingChange('social_links', 'facebook', e.target.value)}
                        />
                         <InputField 
                            id="social-whatsapp" 
                            label="WhatsApp URL" 
                            type="url" 
                            value={settings.social_links?.whatsapp || ''}
                            onChange={(e) => handleSettingChange('social_links', 'whatsapp', e.target.value)}
                        />
                         <InputField 
                            id="social-instagram" 
                            label="Instagram URL" 
                            type="url" 
                            value={settings.social_links?.instagram || ''}
                            onChange={(e) => handleSettingChange('social_links', 'instagram', e.target.value)}
                        />
                         <InputField 
                            id="social-twitter" 
                            label="Twitter URL" 
                            type="url" 
                            value={settings.social_links?.twitter || ''}
                            onChange={(e) => handleSettingChange('social_links', 'twitter', e.target.value)}
                        />
                    </div>
                     <div className="text-right mt-4">
                        <Button onClick={() => handleSave('social_links', settings.social_links)} disabled={isSaving === 'social_links'}>
                             {isSaving === 'social_links' ? <Loader2 className="animate-spin"/> : 'Save Social Links'}
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SiteSettingsPage;