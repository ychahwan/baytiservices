import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';
import type {
  StoreFormData,
  StoreCategory,
  AddressFormData,
} from '../lib/types';
import { AddressForm } from '../components/AddressForm';

type TabType = 'account' | 'store' | 'owner' | 'address';

export function StoreForm() {
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<StoreCategory[]>([]);

  const [formData, setFormData] = useState<StoreFormData>({
    email: '',
    password: '',
    name: '',
    owner_first_name: '',
    owner_last_name: '',
    category_id: '',
    phone_number: '',
    description: '',
  });

  const [addressData, setAddressData] = useState<AddressFormData>({
    country_id: '',
    state: '',
    city: '',
    street_address: '',
    postal_code: '',
    building_number: '',
    apartment_number: '',
    additional_info: '',
  });

  useEffect(() => {
    loadCategories();
    if (id) {
      loadStore();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('store_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadStore = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`*, addresses (*, countries (*))`)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          email: '',
          password: '',
          name: data.name,
          owner_first_name: data.owner_first_name,
          owner_last_name: data.owner_last_name,
          category_id: data.category_id,
          phone_number: data.phone_number || '',
          description: data.description || '',
          address_id: data.address_id || null,
        });

        if (data.addresses) {
          setAddressData({
            country_id: data.addresses.country_id || '',
            state: data.addresses.state || '',
            city: data.addresses.city || '',
            street_address: data.addresses.street_address || '',
            postal_code: data.addresses.postal_code || '',
            building_number: data.addresses.building_number || '',
            apartment_number: data.addresses.apartment_number || '',
            additional_info: data.addresses.additional_info || '',
          });
        }
      }
    } catch (err) {
      console.error('Error loading store:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const callEdgeFunction = async (
    endpoint: string,
    payload: any,
    token: string
  ) => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed API call');
    }

    return await response.json();
  };
  const validateForm = () => {
    const errors: string[] = [];
  
    if (!formData.name.trim()) {
      errors.push('name');
    }
  
    if (!formData.phone_number.trim()) {
      errors.push('phone_number');
    }
  
    if (!id) {
      if (!formData.email.trim()) {
        errors.push('email');
      }
      if (!formData.password.trim()) {
        errors.push('password');
      }
    }
  
  
    setInvalidFields(errors);
  
    if (errors.length > 0) {
      setError('Please fill all required fields correctly.');
      return false;
    }
  
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return; // Stop submit if validation fails
    }
    setLoading(true);
    setError(null);
    let newlyCreatedAddressId: string | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No authenticated user');

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userAccessToken = session?.access_token;
      if (!userAccessToken) throw new Error('User access token not found');

      let addressId = formData.address_id;

      // Handle address creation/update
      if (addressData.country_id) {
        if (addressId) {
          const { error: addressError } = await supabase
            .from('addresses')
            .update({
              ...addressData,
              updated_by: user.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', addressId);

          if (addressError) throw addressError;
        } else {
          const { data: newAddress, error: addressError } = await supabase
            .from('addresses')
            .insert([
              {
                ...addressData,
                created_by: user.id,
                updated_by: user.id,
              },
            ])
            .select()
            .single();

          if (addressError) throw addressError;
          if (newAddress) {
            addressId = newAddress.id;
            newlyCreatedAddressId = newAddress.id;
          }
        }
      }

      if (id) {
        // Update store logic (direct to database)
        await callEdgeFunction(
          'update-store',
          {
            id,
            name: formData.name,
            owner_first_name: formData.owner_first_name,
            owner_last_name: formData.owner_last_name,
            category_id: formData.category_id,
            phone_number: formData.phone_number,
            description: formData.description,
            address_id: addressId,
          },
          userAccessToken
        );
      } else {
        // Create store logic (call create-store edge function)
        await callEdgeFunction(
          'create-store',
          {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            owner_first_name: formData.owner_first_name,
            owner_last_name: formData.owner_last_name,
            category_id: formData.category_id,
            phone_number: formData.phone_number,
            description: formData.description,
            address_id: addressId,
          },
          userAccessToken
        );
      }

      navigate('/stores');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      if (newlyCreatedAddressId) {
        try {
          await supabase
            .from('addresses')
            .delete()
            .eq('id', newlyCreatedAddressId);
          console.info('Rolled back newly created address.');
        } catch (rollbackError) {
          console.error('Failed to rollback address:', rollbackError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return !id ? (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
                <span className="text-red-500">*</span>  </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`form-input ${
                  invalidFields.includes('email') ? 'border-red-500' : ''
                }`}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
                <span className="text-red-500">*</span>  </label>
              <input
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={`form-input ${
                  invalidFields.includes('password') ? 'border-red-500' : ''
                }`}
              />
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            Account information cannot be modified after creation
          </div>
        );

      case 'store':
        return (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Store Name
                <span className="text-red-500">*</span> </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`form-input ${
                  invalidFields.includes('name') ? 'border-red-500' : ''
                }`}
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700"
              >
                Category
              </label>
              <select
                id="category"
                required
                value={formData.category_id}
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
                className="form-select"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="phone_number"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number
                <span className="text-red-500">*</span> </label>
              <input
                type="tel"
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
                className={`form-input ${
                  invalidFields.includes('phone_number') ? 'border-red-500' : ''
                }`}
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="form-textarea"
              />
            </div>
          </div>
        );

      case 'owner':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="owner_first_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Owner First Name
                </label>
                <input
                  type="text"
                  id="owner_first_name"
                  required
                  value={formData.owner_first_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      owner_first_name: e.target.value,
                    })
                  }
                  className="form-input"
                />
              </div>
              <div>
                <label
                  htmlFor="owner_last_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Owner Last Name
                </label>
                <input
                  type="text"
                  id="owner_last_name"
                  required
                  value={formData.owner_last_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      owner_last_name: e.target.value,
                    })
                  }
                  className="form-input"
                />
              </div>
            </div>
          </div>
        );

      case 'address':
        return (
          <div>
            <AddressForm
              onAddressChange={setAddressData}
              existingAddressId={formData.address_id}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/stores')}
                  className="mr-4 text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-3xl font-semibold text-gray-900">
                  {id ? 'Edit Store' : 'Create Store'}
                </h1>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : id ? 'Update' : 'Create'}
              </button>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {!id && (
                <button
                  onClick={() => setActiveTab('account')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'account'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Account
                </button>
              )}
              <button
                onClick={() => setActiveTab('store')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'store'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Store
              </button>
              <button
                onClick={() => setActiveTab('owner')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'owner'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Owner
              </button>
              <button
                onClick={() => setActiveTab('address')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'address'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Address
              </button>
            </nav>
          </div>

          <div className="p-6">
            <form className="space-y-6">{renderTabContent()}</form>
          </div>
        </div>
      </div>
    </div>
  );
}
