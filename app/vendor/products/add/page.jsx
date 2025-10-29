'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { Package, Upload, X, Plus, ArrowLeft } from 'lucide-react';
import productService from '../../../../lib/services/productService';
import vendorService from '../../../../lib/services/vendorService';
import storeService from '../../../../lib/services/storeService';
import attributeService from '../../../../lib/services/attributeService';

export default function AddProductPage() {
  const { user, isLoading, logout, tokens } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Dropdown data
  const [categories, setCategories] = useState([]);
  const [level2Categories, setLevel2Categories] = useState([]);
  const [level3Categories, setLevel3Categories] = useState([]);
  const [level4Categories, setLevel4Categories] = useState([]);
  const [relatedCategories, setRelatedCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [stores, setStores] = useState([]);
  const [attributeDefinitions, setAttributeDefinitions] = useState([]);
  const [groupedAttributes, setGroupedAttributes] = useState({});
  
  // Form data
  const [formData, setFormData] = useState({
    // Basic Information
    title: '',
    description: '',
    short_description: '',
    
    // Categorization
    level1: '',
    level2: '',
    level3: '',
    level4: '',
    related_categories: [], // Amazon-style related categories
    brand_id: '',
    store_id: '',
    
    // Pricing
    price: '',
    discount_price: '',
    cost_price: '',
    
    // Inventory
    stock_quantity: '',
    min_stock_level: '',
    sku: '',
    barcode: '',
    
    // Product Images (array of objects)
    images: [],
    
    // Specifications (key-value pairs)
    specifications: {},
    
    // Attributes (key-value pairs)
    attributes: {},
    
    // SEO & Marketing
    meta_title: '',
    meta_description: '',
    tags: [],
    
    // Product Status
    status: 'draft', // Will be changed to 'active' when approved
    approval_status: 'pending', // Needs SuperAdmin approval
    is_featured: false,
    is_digital: false,
    
    // Product Special Categories
    is_best_seller: false,
    is_new_seller: false,
    is_offer: false,
    special_deals_for_qliq_plus: false,
    
    // Physical Properties (handled as nested attributes)
    weight: '',
    
    // Warranty & Support
    warranty_period: '',
    warranty_type: ''
  });

  // Image upload state
  const [imageUrls, setImageUrls] = useState(['']);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [attrKey, setAttrKey] = useState('');
  const [attrValue, setAttrValue] = useState('');
  const [attrValueType, setAttrValueType] = useState('text');
  const [nestedAttrKey, setNestedAttrKey] = useState('');
  const [nestedAttrValue, setNestedAttrValue] = useState('');
  
  // Store requirement state
  const [showStoreRequired, setShowStoreRequired] = useState(false);
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [storeFormData, setStoreFormData] = useState({
    name: '',
    description: '',
    logo: '',
    banner: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    }
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/admin');
      return;
    }
    if (user) {
      fetchDropdownData();
    }
  }, [user, isLoading, router]);

  const fetchDropdownData = async () => {
    try {
      // Fetch categories (level 1)
      try {
        const categoriesRes = await productService.getCategories({ level: 1 });
        console.log('Categories response:', categoriesRes);
        const categoryData = Array.isArray(categoriesRes) ? categoriesRes : 
                            (categoriesRes?.data && Array.isArray(categoriesRes.data)) ? categoriesRes.data :
                            (categoriesRes?.categories && Array.isArray(categoriesRes.categories)) ? categoriesRes.categories : [];
        setCategories(categoryData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
      
      // Fetch brands
      try {
        const brandsRes = await productService.getBrands();
        console.log('Brands response:', brandsRes);
        const brandData = Array.isArray(brandsRes) ? brandsRes : 
                         (brandsRes?.data?.data?.brands && Array.isArray(brandsRes.data.data.brands)) ? brandsRes.data.data.brands :
                         (brandsRes?.data && brandsRes.data.brands && Array.isArray(brandsRes.data.brands)) ? brandsRes.data.brands :
                         (brandsRes?.data && Array.isArray(brandsRes.data)) ? brandsRes.data :
                         (brandsRes?.brands && Array.isArray(brandsRes.brands)) ? brandsRes.brands : [];
        
        console.log('Parsed brand data:', brandData);
        console.log('Number of brands found:', brandData.length);
        setBrands(brandData);
      } catch (error) {
        console.error('Error fetching brands:', error);
        setBrands([]);
      }
      
      // Fetch vendor's stores
      try {
        // Validate user ID before making API call
        if (!user.id) {
          console.error('❌ No user ID available for store fetch');
          setStores([]);
          setShowStoreRequired(true);
          return;
        }
        
        // Force cache bypass to get fresh data
        const shouldClearCache = true;
        const storesRes = await storeService.getStoresByVendor(user.id, shouldClearCache);
        console.log('=== STORE FETCH DEBUG ===');
        console.log('User ID for store fetch:', user.id);
        console.log('User ID type:', typeof user.id);
        console.log('User ID length:', user.id?.length);
        console.log('Full user object:', user);
        console.log('Stores response:', storesRes);
        
        // Extract store data from various possible response structures
        let storeData = [];
        if (Array.isArray(storesRes)) {
          storeData = storesRes;
        } else if (storesRes?.data?.data?.stores && Array.isArray(storesRes.data.data.stores)) {
          // Handle nested data structure from backend
          storeData = storesRes.data.data.stores;
        } else if (storesRes?.data?.stores && Array.isArray(storesRes.data.stores)) {
          storeData = storesRes.data.stores;
        } else if (storesRes?.data && Array.isArray(storesRes.data)) {
          storeData = storesRes.data;
        } else if (storesRes?.stores && Array.isArray(storesRes.stores)) {
          storeData = storesRes.stores;
        }
        
        console.log('Extracted store data:', storeData);
        console.log('Number of stores found:', storeData.length);
        
        setStores(storeData);
        
        // Check if vendor has stores
        if (storeData.length === 0) {
          console.log('No stores found for vendor, showing store creation form');
          setShowStoreRequired(true);
        } else {
          console.log('Stores found:', storeData.length, 'hiding store creation form');
          setShowStoreRequired(false);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
        console.error('Error details:', error.response?.data || error.message);
        setStores([]);
        setShowStoreRequired(true);
      }
      
      // Fetch attribute definitions
      try {
        const attributesRes = await attributeService.getAllAttributes({ status: 'active' });
        console.log('Attributes response:', attributesRes);
        const attributeData = Array.isArray(attributesRes) ? attributesRes : 
                            (attributesRes?.data && Array.isArray(attributesRes.data)) ? attributesRes.data :
                            (attributesRes?.attributes && Array.isArray(attributesRes.attributes)) ? attributesRes.attributes : [];
        setAttributeDefinitions(attributeData);
      } catch (error) {
        console.error('Error fetching attributes:', error);
        setAttributeDefinitions([]);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  // Store creation handler
  const handleCreateStore = async () => {
    setIsCreatingStore(true);
    try {
      const storeData = {
        ...storeFormData,
        ownerId: user.id,
        isActive: true
      };
      
      console.log('Creating store with data:', storeData);
      console.log('User ID being used:', user.id);
      
      const response = await storeService.createStore(storeData);
      console.log('Store created response:', response);
      console.log('Created store ownerId:', response.ownerId || response.data?.ownerId);
      
      // Refresh stores list
      await fetchDropdownData();
      setShowStoreRequired(false);
      setStoreFormData({
        name: '',
        description: '',
        logo: '',
        banner: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: ''
        }
      });
      
      alert('Store created successfully! You can now add products.');
    } catch (error) {
      console.error('Error creating store:', error);
      alert('Error creating store: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsCreatingStore(false);
    }
  };

  const handleStoreInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setStoreFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setStoreFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleLevel1Change = async (e) => {
    const level1Id = e.target.value;
    setFormData(prev => ({ ...prev, level1: level1Id, level2: '', level3: '', level4: '', related_categories: [] }));
    
    if (level1Id) {
      try {
        const res = await productService.getCategories({ level: 2, parentId: level1Id });
        const categoryData = Array.isArray(res) ? res : 
                            (res?.data && Array.isArray(res.data)) ? res.data :
                            (res?.categories && Array.isArray(res.categories)) ? res.categories : [];
        setLevel2Categories(categoryData);
        
        // Fetch related categories (Amazon-style)
        try {
          const relatedRes = await productService.getRelatedCategories(level1Id);
          const relatedData = relatedRes?.data?.related || [];
          setRelatedCategories(relatedData);
        } catch (error) {
          console.error('Error fetching related categories:', error);
          setRelatedCategories([]);
        }
        
        // Fetch attributes for this category (single category)
        try {
          console.log('🔍 Fetching attributes for Level 1 category:', level1Id);
          const attributesRes = await attributeService.getAttributesByCategory(level1Id);
          console.log('📊 Attributes API response:', attributesRes);
          const categoryAttributes = Array.isArray(attributesRes) ? attributesRes : 
                                   (attributesRes?.data && Array.isArray(attributesRes.data)) ? attributesRes.data :
                                   (attributesRes?.attributes && Array.isArray(attributesRes.attributes)) ? attributesRes.attributes : [];
          console.log('✅ Parsed attributes:', categoryAttributes);
          setAttributeDefinitions(categoryAttributes);
          setGroupedAttributes({ 'Primary Category': categoryAttributes });
        } catch (error) {
          console.error('Error fetching category attributes:', error);
          // Fallback to all attributes if category-specific fetch fails
          try {
            const allAttributesRes = await attributeService.getAllAttributes({ status: 'active' });
            const allAttributeData = Array.isArray(allAttributesRes) ? allAttributesRes : 
                                   (allAttributesRes?.data && Array.isArray(allAttributesRes.data)) ? allAttributesRes.data :
                                   (allAttributesRes?.attributes && Array.isArray(allAttributesRes.attributes)) ? allAttributesRes.attributes : [];
            setAttributeDefinitions(allAttributeData);
            setGroupedAttributes({ 'General Attributes': allAttributeData });
          } catch (fallbackError) {
            console.error('Error fetching all attributes:', fallbackError);
            setAttributeDefinitions([]);
            setGroupedAttributes({});
          }
        }
      } catch (error) {
        console.error('Error fetching level 2 categories:', error);
        setLevel2Categories([]);
      }
    } else {
      setLevel2Categories([]);
      setLevel3Categories([]);
      setLevel4Categories([]);
      setRelatedCategories([]);
      // Reset to all attributes when no category is selected
      try {
        const allAttributesRes = await attributeService.getAllAttributes({ status: 'active' });
        const allAttributeData = Array.isArray(allAttributesRes) ? allAttributesRes : 
                               (allAttributesRes?.data && Array.isArray(allAttributesRes.data)) ? allAttributesRes.data :
                               (allAttributesRes?.attributes && Array.isArray(allAttributesRes.attributes)) ? allAttributesRes.attributes : [];
        setAttributeDefinitions(allAttributeData);
        setGroupedAttributes({ 'General Attributes': allAttributeData });
      } catch (error) {
        console.error('Error fetching all attributes:', error);
        setAttributeDefinitions([]);
        setGroupedAttributes({});
      }
    }
  };

  const handleLevel2Change = async (e) => {
    const level2Id = e.target.value;
    setFormData(prev => ({ ...prev, level2: level2Id, level3: '', level4: '' }));
    
    if (level2Id) {
      try {
        const res = await productService.getCategories({ level: 3, parentId: level2Id });
        const categoryData = Array.isArray(res) ? res : 
                            (res?.data && Array.isArray(res.data)) ? res.data :
                            (res?.categories && Array.isArray(res.categories)) ? res.categories : [];
        setLevel3Categories(categoryData);
        
        // Fetch attributes for Level 2 category
        try {
          console.log('🔍 Fetching attributes for Level 2 category:', level2Id);
          const attributesRes = await attributeService.getAttributesByCategory(level2Id);
          console.log('📊 Level 2 Attributes API response:', attributesRes);
          const categoryAttributes = Array.isArray(attributesRes) ? attributesRes : 
                                   (attributesRes?.data && Array.isArray(attributesRes.data)) ? attributesRes.data :
                                   (attributesRes?.attributes && Array.isArray(attributesRes.attributes)) ? attributesRes.attributes : [];
          console.log('✅ Level 2 Parsed attributes:', categoryAttributes);
          setAttributeDefinitions(categoryAttributes);
          setGroupedAttributes({ 'Level 2 Category': categoryAttributes });
        } catch (error) {
          console.error('Error fetching level 2 category attributes:', error);
        }
      } catch (error) {
        console.error('Error fetching level 3 categories:', error);
        setLevel3Categories([]);
      }
    } else {
      setLevel3Categories([]);
      setLevel4Categories([]);
      // Reset to Level 1 attributes
      try {
        const attributesRes = await attributeService.getAttributesByCategory(formData.level1);
        const categoryAttributes = Array.isArray(attributesRes) ? attributesRes : 
                                 (attributesRes?.data && Array.isArray(attributesRes.data)) ? attributesRes.data :
                                 (attributesRes?.attributes && Array.isArray(attributesRes.attributes)) ? attributesRes.attributes : [];
        setAttributeDefinitions(categoryAttributes);
        setGroupedAttributes({ 'Primary Category': categoryAttributes });
      } catch (error) {
        console.error('Error fetching level 1 attributes:', error);
      }
    }
  };

  const handleLevel3Change = async (e) => {
    const level3Id = e.target.value;
    setFormData(prev => ({ ...prev, level3: level3Id, level4: '' }));
    
    if (level3Id) {
      try {
        const res = await productService.getCategories({ level: 4, parentId: level3Id });
        const categoryData = Array.isArray(res) ? res : 
                            (res?.data && Array.isArray(res.data)) ? res.data :
                            (res?.categories && Array.isArray(res.categories)) ? res.categories : [];
        setLevel4Categories(categoryData);
        
        // Fetch attributes for Level 3 category
        try {
          const attributesRes = await attributeService.getAttributesByCategory(level3Id);
          const categoryAttributes = Array.isArray(attributesRes) ? attributesRes : 
                                   (attributesRes?.data && Array.isArray(attributesRes.data)) ? attributesRes.data :
                                   (attributesRes?.attributes && Array.isArray(attributesRes.attributes)) ? attributesRes.attributes : [];
          setAttributeDefinitions(categoryAttributes);
          setGroupedAttributes({ 'Level 3 Category': categoryAttributes });
        } catch (error) {
          console.error('Error fetching level 3 category attributes:', error);
        }
      } catch (error) {
        console.error('Error fetching level 4 categories:', error);
        setLevel4Categories([]);
      }
    } else {
      setLevel4Categories([]);
      // Reset to Level 2 attributes
      try {
        const attributesRes = await attributeService.getAttributesByCategory(formData.level2);
        const categoryAttributes = Array.isArray(attributesRes) ? attributesRes : 
                                 (attributesRes?.data && Array.isArray(attributesRes.data)) ? attributesRes.data :
                                 (attributesRes?.attributes && Array.isArray(attributesRes.attributes)) ? attributesRes.attributes : [];
        setAttributeDefinitions(categoryAttributes);
        setGroupedAttributes({ 'Level 2 Category': categoryAttributes });
      } catch (error) {
        console.error('Error fetching level 2 attributes:', error);
      }
    }
  };

  const handleLevel4Change = async (e) => {
    const level4Id = e.target.value;
    setFormData(prev => ({ ...prev, level4: level4Id }));
    
    if (level4Id) {
      // Fetch attributes for Level 4 category
      try {
        const attributesRes = await attributeService.getAttributesByCategory(level4Id);
        const categoryAttributes = Array.isArray(attributesRes) ? attributesRes : 
                                 (attributesRes?.data && Array.isArray(attributesRes.data)) ? attributesRes.data :
                                 (attributesRes?.attributes && Array.isArray(attributesRes.attributes)) ? attributesRes.attributes : [];
        setAttributeDefinitions(categoryAttributes);
        setGroupedAttributes({ 'Level 4 Category': categoryAttributes });
      } catch (error) {
        console.error('Error fetching level 4 category attributes:', error);
      }
    } else {
      // Reset to Level 3 attributes
      try {
        const attributesRes = await attributeService.getAttributesByCategory(formData.level3);
        const categoryAttributes = Array.isArray(attributesRes) ? attributesRes : 
                                 (attributesRes?.data && Array.isArray(attributesRes.data)) ? attributesRes.data :
                                 (attributesRes?.attributes && Array.isArray(attributesRes.attributes)) ? attributesRes.attributes : [];
        setAttributeDefinitions(categoryAttributes);
        setGroupedAttributes({ 'Level 3 Category': categoryAttributes });
      } catch (error) {
        console.error('Error fetching level 3 attributes:', error);
      }
    }
  };

  // Handle related category selection (Amazon-style)
  const handleRelatedCategoryChange = async (selectedCategoryIds) => {
    setFormData(prev => ({ ...prev, related_categories: selectedCategoryIds }));
    
    if (selectedCategoryIds.length > 0 && formData.level1) {
      try {
        // Get attributes from primary category + related categories
        const allCategoryIds = [formData.level1, ...selectedCategoryIds];
        const attributesRes = await attributeService.getAttributesByMultipleCategories(allCategoryIds);
        
        const attributes = attributesRes?.data || [];
        const grouped = attributesRes?.grouped || {};
        
        setAttributeDefinitions(attributes);
        setGroupedAttributes(grouped);
      } catch (error) {
        console.error('Error fetching multi-category attributes:', error);
      }
    }
  };

  const handleImageUrlChange = (index, value) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
    
    // Update form data
    const images = newUrls
      .filter(url => url.trim() !== '')
      .map((url, idx) => ({
        url: url,
        is_primary: idx === 0,
        alt_text: formData.title || 'Product image'
      }));
    setFormData(prev => ({ ...prev, images }));
  };

  const addImageUrl = () => {
    const currentTotal = uploadedImages.length + imageUrls.filter(url => url.trim() !== '').length;
    if (currentTotal >= 5) {
      alert('Maximum 5 images allowed. Please remove some images before adding new ones.');
      return;
    }
    setImageUrls([...imageUrls, '']);
  };

  const removeImageUrl = (index) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    
    const images = newUrls
      .filter(url => url.trim() !== '')
      .map((url, idx) => ({
        url: url,
        is_primary: idx === 0,
        alt_text: formData.title || 'Product image'
      }));
    setFormData(prev => ({ ...prev, images }));
  };

  // File upload handlers
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    // Check total image limit
    const currentTotal = uploadedImages.length + imageUrls.filter(url => url.trim() !== '').length;
    const availableSlots = 5 - currentTotal;
    
    if (availableSlots <= 0) {
      alert('Maximum 5 images allowed. Please remove some images before adding new ones.');
      return;
    }
    
    setIsUploading(true);
    const uploadPromises = [];
    
    for (let i = 0; i < Math.min(files.length, availableSlots); i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image. Please select only image files.`);
        continue;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Please select files smaller than 5MB.`);
        continue;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'products');
      formData.append('optimize', 'true');
      formData.append('maxWidth', '1200');
      formData.append('maxHeight', '1200');
      formData.append('quality', '85');
      
      uploadPromises.push(
        fetch(`${process.env.NEXT_PUBLIC_MEDIA_API_URL || 'http://localhost:5005/api'}/upload/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens?.accessToken}`
          },
          body: formData
        }).then(response => response.json())
      );
    }
    
    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(result => result.success);
      
      if (successfulUploads.length > 0) {
        const newImages = successfulUploads.map((result, index) => ({
          url: result.data.url,
          is_primary: uploadedImages.length === 0 && index === 0,
          alt_text: formData.title || 'Product image',
          uploaded: true
        }));
        
        setUploadedImages(prev => [...prev, ...newImages]);
        
        // Update form data with all images (URLs + uploaded)
        const allImages = [
          ...uploadedImages,
          ...newImages,
          ...imageUrls.filter(url => url.trim() !== '').map((url, idx) => ({
            url: url,
            is_primary: uploadedImages.length === 0 && newImages.length === 0 && idx === 0,
            alt_text: formData.title || 'Product image',
            uploaded: false
          }))
        ];
        
        setFormData(prev => ({ ...prev, images: allImages }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  };

  const removeUploadedImage = (index) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    
    // Update form data
    const allImages = [
      ...newImages,
      ...imageUrls.filter(url => url.trim() !== '').map((url, idx) => ({
        url: url,
        is_primary: newImages.length === 0 && idx === 0,
        alt_text: formData.title || 'Product image',
        uploaded: false
      }))
    ];
    
    setFormData(prev => ({ ...prev, images: allImages }));
  };

  const setPrimaryImage = (index) => {
    const newImages = uploadedImages.map((img, i) => ({
      ...img,
      is_primary: i === index
    }));
    setUploadedImages(newImages);
    
    // Update form data
    const allImages = [
      ...newImages,
      ...imageUrls.filter(url => url.trim() !== '').map((url, idx) => ({
        url: url,
        is_primary: false,
        alt_text: formData.title || 'Product image',
        uploaded: false
      }))
    ];
    
    setFormData(prev => ({ ...prev, images: allImages }));
  };

  // Helper functions for attribute handling
  const handleAttributeChange = (attributeName, value) => {
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attributeName]: value
      }
    }));
  };

  const handleSpecificationChange = (attributeName, value) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [attributeName]: value
      }
    }));
  };

  const renderAttributeInput = (attribute) => {
    const currentValue = formData.attributes[attribute.name] || '';
    
    switch (attribute.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleAttributeChange(attribute.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${attribute.displayName.toLowerCase()}`}
            maxLength={attribute.maxLength}
            minLength={attribute.minLength}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleAttributeChange(attribute.name, parseFloat(e.target.value) || '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${attribute.displayName.toLowerCase()}`}
            min={attribute.minValue}
            max={attribute.maxValue}
          />
        );
      
      case 'boolean':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleAttributeChange(attribute.name, e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select {attribute.displayName}</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      
      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleAttributeChange(attribute.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select {attribute.displayName}</option>
            {attribute.options?.map((option, index) => (
              <option key={index} value={option.value}>
                {option.displayName}
              </option>
            ))}
          </select>
        );
      
      case 'multiselect':
        return (
          <div className="space-y-2">
            {attribute.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(currentValue) && currentValue.includes(option.value)}
                  onChange={(e) => {
                    const currentArray = Array.isArray(currentValue) ? currentValue : [];
                    const newArray = e.target.checked
                      ? [...currentArray, option.value]
                      : currentArray.filter(v => v !== option.value);
                    handleAttributeChange(attribute.name, newArray);
                  }}
                  className="mr-2"
                />
                <span>{option.displayName}</span>
              </label>
            ))}
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleAttributeChange(attribute.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${attribute.displayName.toLowerCase()}`}
          />
        );
    }
  };

  const renderSpecificationInput = (attribute) => {
    const currentValue = formData.specifications[attribute.name] || '';
    
    switch (attribute.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleSpecificationChange(attribute.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${attribute.displayName.toLowerCase()}`}
            maxLength={attribute.maxLength}
            minLength={attribute.minLength}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleSpecificationChange(attribute.name, parseFloat(e.target.value) || '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${attribute.displayName.toLowerCase()}`}
            min={attribute.minValue}
            max={attribute.maxValue}
          />
        );
      
      case 'boolean':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleSpecificationChange(attribute.name, e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select {attribute.displayName}</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      
      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleSpecificationChange(attribute.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select {attribute.displayName}</option>
            {attribute.options?.map((option, index) => (
              <option key={index} value={option.value}>
                {option.displayName}
              </option>
            ))}
          </select>
        );
      
      case 'multiselect':
        return (
          <div className="space-y-2">
            {attribute.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(currentValue) && currentValue.includes(option.value)}
                  onChange={(e) => {
                    const currentArray = Array.isArray(currentValue) ? currentValue : [];
                    const newArray = e.target.checked
                      ? [...currentArray, option.value]
                      : currentArray.filter(v => v !== option.value);
                    handleSpecificationChange(attribute.name, newArray);
                  }}
                  className="mr-2"
                />
                <span>{option.displayName}</span>
              </label>
            ))}
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleSpecificationChange(attribute.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${attribute.displayName.toLowerCase()}`}
          />
        );
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specKey.trim()]: specValue.trim()
        }
      }));
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpecification = (key) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return { ...prev, specifications: newSpecs };
    });
  };

  const addAttribute = () => {
    if (attrKey.trim()) {
      const key = attrKey.trim();
      
      if (attrValueType === 'text') {
        if (attrValue.trim()) {
          setFormData(prev => ({
            ...prev,
            attributes: {
              ...prev.attributes,
              [key]: attrValue.trim()
            }
          }));
          setAttrKey('');
          setAttrValue('');
        }
      } else {
        // For nested objects, create empty object
        setFormData(prev => ({
          ...prev,
          attributes: {
            ...prev.attributes,
            [key]: {}
          }
        }));
        setAttrKey('');
        setAttrValue('');
      }
    }
  };

  const addNestedAttribute = (parentKey) => {
    if (nestedAttrKey.trim() && nestedAttrValue.trim()) {
      setFormData(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          [parentKey]: {
            ...prev.attributes[parentKey],
            [nestedAttrKey.trim()]: nestedAttrValue.trim()
          }
        }
      }));
      setNestedAttrKey('');
      setNestedAttrValue('');
    }
  };

  const removeNestedAttribute = (parentKey, subKey) => {
    setFormData(prev => {
      const newAttrs = { ...prev.attributes };
      if (newAttrs[parentKey] && typeof newAttrs[parentKey] === 'object') {
        const newNestedObj = { ...newAttrs[parentKey] };
        delete newNestedObj[subKey];
        newAttrs[parentKey] = newNestedObj;
      }
      return { ...prev, attributes: newAttrs };
    });
  };

  const removeAttribute = (key) => {
    setFormData(prev => {
      const newAttrs = { ...prev.attributes };
      delete newAttrs[key];
      return { ...prev, attributes: newAttrs };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Product title is required';
    if (!formData.description.trim()) newErrors.description = 'Product description is required';
    if (!formData.level1) newErrors.level1 = 'Category Level 1 is required';
    if (!formData.brand_id) newErrors.brand_id = 'Brand is required';
    if (!formData.store_id) newErrors.store_id = 'Store is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
    if (!formData.stock_quantity || formData.stock_quantity < 0) newErrors.stock_quantity = 'Valid stock quantity is required';
    const totalImages = uploadedImages.length + imageUrls.filter(url => url.trim() !== '').length;
    if (totalImages === 0) newErrors.images = 'At least one product image is required';
    else if (totalImages > 5) newErrors.images = 'Maximum 5 images allowed';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if vendor has stores first
    if (stores.length === 0) {
      alert('You must create a store before adding products. Please create a store first.');
      return;
    }
    
    // Check if store is selected
    if (!formData.store_id) {
      alert('Please select a store for this product');
      return;
    }
    
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data for submission
      const allImages = [
        ...uploadedImages,
        ...imageUrls.filter(url => url.trim() !== '').map((url, idx) => ({
          url: url,
          is_primary: uploadedImages.length === 0 && idx === 0,
          alt_text: formData.title || 'Product image',
          uploaded: false
        }))
      ];
      
      const submitData = {
        ...formData,
        images: allImages,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : undefined,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
        stock_quantity: parseInt(formData.stock_quantity),
        min_stock_level: formData.min_stock_level ? parseInt(formData.min_stock_level) : undefined,
        warranty_period: formData.warranty_period ? parseInt(formData.warranty_period) : undefined
      };
      
      await productService.createProduct(submitData);
      alert('Product created successfully!');
      router.push('/vendor/products');
    } catch (error) {
      console.error('Error creating product:', error);
      alert(error.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        userType="vendor"
        onLogout={logout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          userType="vendor"
          user={user}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/vendor/products')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
                  <p className="text-gray-600 mt-1">Fill in the product details below</p>
                </div>
              </div>
            </div>

            {/* Debug Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-yellow-800">Debug Info:</h3>
                <button
                  onClick={fetchDropdownData}
                  className="px-3 py-1 text-xs bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded transition-colors"
                >
                  Refresh Data
                </button>
              </div>
              <div className="text-xs text-yellow-700 space-y-1">
                <p>Categories loaded: {categories.length}</p>
                <p>Brands loaded: {brands.length}</p>
                <p>Stores loaded: {stores.length}</p>
                <p>Attribute definitions loaded: {attributeDefinitions.length}</p>
                {stores.length > 0 && (
                  <p>First store: {stores[0]?.name || 'No name'}</p>
                )}
                {brands.length > 0 && (
                  <p>First brand: {brands[0]?.name || 'No name'}</p>
                )}
                {attributeDefinitions.length > 0 && (
                  <p>First attribute: {attributeDefinitions[0]?.displayName || 'No name'}</p>
                )}
              </div>
            </div>

            {/* Store Requirement Section */}
            {showStoreRequired && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Package className="w-8 h-8 text-red-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-lg font-medium text-red-800 mb-2">
                      Store Required
                    </h3>
                    <p className="text-red-700 mb-4">
                      You need to create a store before adding products. A store helps organize your products and provides a professional presence for customers.
                    </p>
                    
                    {/* Store Creation Form */}
                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Create Your Store</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Store Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={storeFormData.name}
                            onChange={handleStoreInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter store name"
                            required
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Store Description
                          </label>
                          <textarea
                            name="description"
                            value={storeFormData.description}
                            onChange={handleStoreInputChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Describe your store"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Store Logo (Icon)
                          </label>
                          <div className="space-y-2">
                            <input
                              type="url"
                              name="logo"
                              value={storeFormData.logo}
                              onChange={handleStoreInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="https://example.com/logo.png"
                            />
                            {storeFormData.logo && (
                              <div className="flex items-center space-x-2">
                                <img 
                                  src={storeFormData.logo} 
                                  alt="Store Logo Preview" 
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                                <span className="text-xs text-green-600">✓ Preview loaded</span>
                              </div>
                            )}
                            <p className="text-xs text-gray-500">Enter image URL for your store logo</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Store Banner (Cover)
                          </label>
                          <div className="space-y-2">
                            <input
                              type="url"
                              name="banner"
                              value={storeFormData.banner}
                              onChange={handleStoreInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="https://example.com/banner.png"
                            />
                            {storeFormData.banner && (
                              <div className="space-y-1">
                                <img 
                                  src={storeFormData.banner} 
                                  alt="Store Banner Preview" 
                                  className="w-full h-24 object-cover rounded-lg border border-gray-300"
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                                <span className="text-xs text-green-600">✓ Preview loaded</span>
                              </div>
                            )}
                            <p className="text-xs text-gray-500">Enter image URL for your store banner</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Store Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={storeFormData.email}
                            onChange={handleStoreInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="store@example.com"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Store Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={storeFormData.phone}
                            onChange={handleStoreInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+1234567890"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Store Address</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <input
                                type="text"
                                name="address.street"
                                value={storeFormData.address.street}
                                onChange={handleStoreInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Street Address"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                name="address.city"
                                value={storeFormData.address.city}
                                onChange={handleStoreInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="City"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                name="address.state"
                                value={storeFormData.address.state}
                                onChange={handleStoreInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="State/Province"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                name="address.country"
                                value={storeFormData.address.country}
                                onChange={handleStoreInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Country"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={handleCreateStore}
                          disabled={isCreatingStore || !storeFormData.name}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isCreatingStore ? 'Creating Store...' : 'Create Store'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" style={{ display: showStoreRequired ? 'none' : 'block' }}>
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Basic Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter product title"
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={5}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter detailed product description"
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Description
                    </label>
                    <textarea
                      name="short_description"
                      value={formData.short_description}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter short description (optional)"
                    />
                  </div>
                </div>
              </div>

              {/* Categories & Brand */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Categories & Brand
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Level 1 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="level1"
                      value={formData.level1}
                      onChange={handleLevel1Change}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.level1 ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                    {errors.level1 && <p className="text-red-500 text-sm mt-1">{errors.level1}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Level 2
                    </label>
                    <select
                      name="level2"
                      value={formData.level2}
                      onChange={handleLevel2Change}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!formData.level1}
                    >
                      <option value="">Select Sub-Category</option>
                      {level2Categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Level 3
                    </label>
                    <select
                      name="level3"
                      value={formData.level3}
                      onChange={handleLevel3Change}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!formData.level2}
                    >
                      <option value="">Select Sub-Category</option>
                      {level3Categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Level 4
                    </label>
                    <select
                      name="level4"
                      value={formData.level4}
                      onChange={handleLevel4Change}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!formData.level3}
                    >
                      <option value="">Select Sub-Category</option>
                      {level4Categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="brand_id"
                      value={formData.brand_id}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.brand_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Brand</option>
                      {brands.map(brand => (
                        <option key={brand._id} value={brand._id}>{brand.name}</option>
                      ))}
                    </select>
                    {errors.brand_id && <p className="text-red-500 text-sm mt-1">{errors.brand_id}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="store_id"
                      value={formData.store_id}
                      onChange={handleInputChange}
                      disabled={stores.length === 0}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.store_id ? 'border-red-500' : 'border-gray-300'
                      } ${stores.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="">{stores.length === 0 ? 'No stores available - Please create a store first' : 'Select Store'}</option>
                      {stores.map(store => (
                        <option key={store._id} value={store._id}>{store.name}</option>
                      ))}
                    </select>
                    {errors.store_id && <p className="text-red-500 text-sm mt-1">{errors.store_id}</p>}
                    {stores.length === 0 && (
                      <p className="text-orange-600 text-sm mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        You must create a store before adding products. Please create a store above.
                      </p>
                    )}
                  </div>
                  
                  {/* Related Categories (Amazon-style) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Related Categories (Optional)
                      <span className="text-xs text-gray-500 ml-2">Select additional categories for cross-category attributes</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {relatedCategories.map(category => (
                        <label key={category._id} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.related_categories.includes(category._id)}
                            onChange={(e) => {
                              const newRelatedCategories = e.target.checked
                                ? [...formData.related_categories, category._id]
                                : formData.related_categories.filter(id => id !== category._id);
                              handleRelatedCategoryChange(newRelatedCategories);
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{category.name}</span>
                        </label>
                      ))}
                    </div>
                    {relatedCategories.length === 0 && formData.level1 && (
                      <p className="text-sm text-gray-500 mt-1">No related categories found for this primary category.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pricing
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Price
                    </label>
                    <input
                      type="number"
                      name="discount_price"
                      value={formData.discount_price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Price
                    </label>
                    <input
                      type="number"
                      name="cost_price"
                      value={formData.cost_price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Inventory */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Inventory
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="stock_quantity"
                      value={formData.stock_quantity}
                      onChange={handleInputChange}
                      min="0"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.stock_quantity ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    {errors.stock_quantity && <p className="text-red-500 text-sm mt-1">{errors.stock_quantity}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Stock Level
                    </label>
                    <input
                      type="number"
                      name="min_stock_level"
                      value={formData.min_stock_level}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SKU-123"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barcode
                    </label>
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123456789"
                    />
                  </div>
                </div>
              </div>

              {/* Product Images */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Product Images <span className="text-red-500 ml-1">*</span>
                </h2>
                
                {/* Drag and Drop Upload Area */}
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${isUploading ? 'opacity-50 pointer-events-none' : ''} ${
                    uploadedImages.length + imageUrls.filter(url => url.trim() !== '').length >= 5 
                      ? 'opacity-50 pointer-events-none' : ''
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        {isUploading ? 'Uploading images...' : 
                         uploadedImages.length + imageUrls.filter(url => url.trim() !== '').length >= 5 
                           ? 'Maximum images reached' : 'Drag & drop images here'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {uploadedImages.length + imageUrls.filter(url => url.trim() !== '').length >= 5 
                          ? 'Remove some images to add more' : 'or click to browse files'}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Supports JPG, PNG, GIF up to 5MB each (max 5 images)
                      </p>
                    </div>
                    
                    {isUploading && (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-blue-600">Uploading...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Uploaded Images Preview */}
                {uploadedImages.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Uploaded Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={image.url}
                              alt={image.alt_text}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Primary Badge */}
                          {image.is_primary && (
                            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                              Primary
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex space-x-2">
                              {!image.is_primary && (
                                <button
                                  type="button"
                                  onClick={() => setPrimaryImage(index)}
                                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                                  title="Set as primary"
                                >
                                  <Package className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeUploadedImage(index)}
                                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                title="Remove image"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* URL Input Section */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Or add images by URL</h3>
                  <div className="space-y-3">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => handleImageUrlChange(index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://example.com/image.jpg"
                        />
                        {index === 0 && uploadedImages.length === 0 && (
                          <span className="text-sm text-blue-600 font-medium whitespace-nowrap">Primary</span>
                        )}
                        {imageUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageUrl(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Another URL</span>
                    </button>
                  </div>
                </div>

                {/* Image Count Info */}
                <div className="mt-4 text-sm text-gray-500">
                  Total images: {uploadedImages.length + imageUrls.filter(url => url.trim() !== '').length} / 5
                </div>
                
                {errors.images && <p className="text-red-500 text-sm mt-2">{errors.images}</p>}
              </div>

              {/* Specifications */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Specifications
                </h2>
                
                {attributeDefinitions.length > 0 ? (
                  <div className="space-y-4">
                    {attributeDefinitions
                      .filter(attr => attr.showInDetail)
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((attribute) => (
                        <div key={attribute._id} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {attribute.displayName}
                            {attribute.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {attribute.description && (
                            <p className="text-xs text-gray-500">{attribute.description}</p>
                          )}
                          {renderSpecificationInput(attribute)}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 mb-4">
                      Select a category to see available specifications, or add custom ones below.
                    </p>
                    
                    {Object.entries(formData.specifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-700">{key}:</span>
                          <span className="ml-2 text-gray-600">{value}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSpecification(key)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={specKey}
                        onChange={(e) => setSpecKey(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Key (e.g., Weight)"
                      />
                      <input
                        type="text"
                        value={specValue}
                        onChange={(e) => setSpecValue(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Value (e.g., 2.5kg)"
                      />
                      <button
                        type="button"
                        onClick={addSpecification}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Attributes */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Attributes (Amazon-Style Cross-Category)
                </h2>
                
                {Object.keys(groupedAttributes).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(groupedAttributes).map(([groupName, attributes]) => (
                      <div key={groupName} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-md font-semibold text-blue-600 mb-3 flex items-center">
                          <Package className="w-4 h-4 mr-2" />
                          {groupName}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {attributes
                            .filter(attr => {
                              // Always show if filterable or searchable
                              if (attr.filterable || attr.searchable) {
                                // For electronics categories, filter out irrelevant attributes
                                if (formData.level2 && formData.level2.includes('68e72172e1764e8d5b19feca')) { // Electronics category
                                  const irrelevantForElectronics = ['material', 'care_instructions', 'season', 'gender', 'age_group', 'eco_friendly', 'vegan'];
                                  return !irrelevantForElectronics.includes(attr.name);
                                }
                                return true;
                              }
                              return false;
                            })
                            .sort((a, b) => a.displayOrder - b.displayOrder)
                            .map((attribute) => (
                              <div key={attribute._id} className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {attribute.displayName}
                                  {attribute.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {attribute.description && (
                                  <p className="text-xs text-gray-500">{attribute.description}</p>
                                )}
                                {renderAttributeInput(attribute)}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : attributeDefinitions.length > 0 ? (
                  <div className="space-y-4">
                    {attributeDefinitions
                      .filter(attr => {
                        // Always show if filterable or searchable
                        if (attr.filterable || attr.searchable) {
                          // For electronics categories, filter out irrelevant attributes
                          if (formData.level2 && formData.level2.includes('68e72172e1764e8d5b19feca')) { // Electronics category
                            const irrelevantForElectronics = ['material', 'care_instructions', 'season', 'gender', 'age_group', 'eco_friendly', 'vegan'];
                            return !irrelevantForElectronics.includes(attr.name);
                          }
                          return true;
                        }
                        return false;
                      })
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((attribute) => (
                        <div key={attribute._id} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {attribute.displayName}
                            {attribute.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {attribute.description && (
                            <p className="text-xs text-gray-500">{attribute.description}</p>
                          )}
                          {renderAttributeInput(attribute)}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 mb-4">
                      Select a category to see available attributes, or add custom ones below.
                    </p>
                    
                    <div className="space-y-4">
                      {Object.entries(formData.attributes).map(([key, value]) => (
                        <div key={key} className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-700 capitalize">{key}:</span>
                            <button
                              type="button"
                              onClick={() => removeAttribute(key)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {typeof value === 'object' && value !== null ? (
                            <div className="ml-4 space-y-2">
                              <div className="text-xs text-gray-500 mb-2 border-l-2 border-blue-300 pl-2">
                                📦 Object: <span className="font-medium">{key}</span>
                              </div>
                              
                              {Object.entries(value).length > 0 ? (
                                Object.entries(value).map(([subKey, subValue]) => (
                                  <div key={subKey} className="flex items-center justify-between p-2 bg-white rounded border">
                                    <div>
                                      <span className="font-medium text-sm text-gray-600">{subKey}:</span>
                                      <span className="ml-2 text-gray-800">{subValue}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeNestedAttribute(key, subKey)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-gray-400 italic p-2 bg-gray-100 rounded">
                                  Empty object - add properties below
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-2 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                <input
                                  type="text"
                                  value={nestedAttrKey}
                                  onChange={(e) => setNestedAttrKey(e.target.value)}
                                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Property name (e.g., length, width, height)"
                                  onKeyPress={(e) => e.key === 'Enter' && addNestedAttribute(key)}
                                />
                                <input
                                  type="text"
                                  value={nestedAttrValue}
                                  onChange={(e) => setNestedAttrValue(e.target.value)}
                                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Property value (e.g., 16, 7.8, 0.7)"
                                  onKeyPress={(e) => e.key === 'Enter' && addNestedAttribute(key)}
                                />
                                <button
                                  type="button"
                                  onClick={() => addNestedAttribute(key)}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="ml-4">
                              <span className="text-gray-800">{value}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <div className="border-t pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={attrKey}
                              onChange={(e) => setAttrKey(e.target.value)}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Key (e.g., color, dimensions, warranty_info)"
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <select
                              value={attrValueType}
                              onChange={(e) => setAttrValueType(e.target.value)}
                              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="text">Simple Value</option>
                              <option value="object">Nested Object</option>
                            </select>
                            
                            {attrValueType === 'text' ? (
                              <input
                                type="text"
                                value={attrValue}
                                onChange={(e) => setAttrValue(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Value (e.g., Red, 12 months)"
                              />
                            ) : (
                              <input
                                type="text"
                                value={attrValue}
                                onChange={(e) => setAttrValue(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                                placeholder="Object name (e.g., dimensions, warranty_info, shipping)"
                                disabled
                              />
                            )}
                            
                            <button
                              type="button"
                              onClick={addAttribute}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <strong>💡 How to use:</strong>
                          </p>
                          <ul className="text-xs text-blue-600 mt-1 space-y-1">
                            <li>• <strong>Simple Value:</strong> color → "Black", warranty → "12 months"</li>
                            <li>• <strong>Nested Object:</strong> dimensions → {"{length: \"16\", width: \"7.8\", height: \"0.7\"}"}</li>
                            <li>• <strong>Any Object:</strong> warranty_info → {"{period: \"12\", type: \"Manufacturer\", provider: \"Apple\"}"}</li>
                            <li>• <strong>Custom Objects:</strong> shipping → {"{weight: \"0.5kg\", dimensions: \"10x5x2cm\", method: \"Standard\"}"}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SEO & Marketing */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  SEO & Marketing
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      name="meta_title"
                      value={formData.meta_title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SEO meta title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      name="meta_description"
                      value={formData.meta_description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SEO meta description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 hover:text-blue-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add a tag"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Settings */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Product Settings
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Featured Product</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="is_best_seller"
                        checked={formData.is_best_seller}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Best Seller</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="is_new_seller"
                        checked={formData.is_new_seller}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">New Arrival</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="is_offer"
                        checked={formData.is_offer}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">On Offer</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="special_deals_for_qliq_plus"
                        checked={formData.special_deals_for_qliq_plus}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Qliq Plus Deal</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="is_digital"
                        checked={formData.is_digital}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Digital Product</span>
                    </label>
                  </div>
                </div>
              </div>


              {/* Warranty */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Warranty & Support
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warranty Period (months)
                    </label>
                    <input
                      type="number"
                      name="warranty_period"
                      value={formData.warranty_period}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="12"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warranty Type
                    </label>
                    <input
                      type="text"
                      name="warranty_type"
                      value={formData.warranty_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Manufacturer Warranty"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 bg-white rounded-lg shadow-sm p-6">
                <button
                  type="button"
                  onClick={() => router.push('/vendor/products')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || stores.length === 0 || !formData.store_id}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={stores.length === 0 ? 'You must create a store before adding products' : !formData.store_id ? 'Please select a store' : ''}
                >
                  {loading ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

