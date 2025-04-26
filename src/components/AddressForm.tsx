import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Country, AddressFormData } from '../lib/types';

interface AddressFormProps {
  onAddressChange: (formData: AddressFormData) => void;
  existingAddressId?: string;
}

export function AddressForm({ onAddressChange, existingAddressId }: AddressFormProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingCountries, setLoadingCountries] = useState<boolean>(false);
  const [loadingAddress, setLoadingAddress] = useState<boolean>(false);
  const [formData, setFormData] = useState<AddressFormData>({
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
    loadCountries();
    if (existingAddressId) {
      loadExistingAddress();
    }
  }, [existingAddressId]);

  const loadCountries = async () => {
    setLoadingCountries(true);
    try {
      const { data, error } = await supabase.from('countries').select('*').order('name');
      if (error) throw error;
      setCountries(data || []);

      const lebanon = data?.find(country => country.code === 'LB');
      if (lebanon && !existingAddressId && !formData.country_id) {
        const newFormData = { ...formData, country_id: lebanon.id };
        setFormData(newFormData);
        onAddressChange(newFormData);
      }
    } catch (err) {
      console.error('Error loading countries:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoadingCountries(false);
    }
  };

  const loadExistingAddress = async () => {
    setLoadingAddress(true);
    try {
      const { data, error } = await supabase.from('addresses').select('*').eq('id', existingAddressId).single();
      if (error) throw error;
      if (data) {
        const newFormData = {
          country_id: data.country_id || '',
          state: data.state || '',
          city: data.city || '',
          street_address: data.street_address || '',
          postal_code: data.postal_code || '',
          building_number: data.building_number || '',
          apartment_number: data.apartment_number || '',
          additional_info: data.additional_info || '',
        };
        setFormData(newFormData);
        onAddressChange(newFormData);
      }
    } catch (err) {
      console.error('Error loading address:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleChange = (field: keyof AddressFormData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    onAddressChange(newFormData);
  };

  return (
    <div className="border rounded-lg">
      {(loadingCountries || loadingAddress) && (
        <div className="flex items-center justify-center p-4">
          <svg className="animate-spin h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      )}

      {!loadingCountries && !loadingAddress && (
        <div className="p-4 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              id="country"
              value={formData.country_id}
              onChange={(e) => handleChange('country_id', e.target.value)}
              className="form-select"
            >
              <option value="">Select a country</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* State & City */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State/Province
              </label>
              <input
                type="text"
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Street Address */}
          <div>
            <label htmlFor="street_address" className="block text-sm font-medium text-gray-700">
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="street_address"
              value={formData.street_address}
              onChange={(e) => handleChange('street_address', e.target.value)}
              className="form-input"
            />
          </div>

          {/* Postal Code & Building Number */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                Postal Code
              </label>
              <input
                type="text"
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="building_number" className="block text-sm font-medium text-gray-700">
                Building Number
              </label>
              <input
                type="text"
                id="building_number"
                value={formData.building_number}
                onChange={(e) => handleChange('building_number', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Apartment Number */}
          <div>
            <label htmlFor="apartment_number" className="block text-sm font-medium text-gray-700">
              Apartment Number
            </label>
            <input
              type="text"
              id="apartment_number"
              value={formData.apartment_number}
              onChange={(e) => handleChange('apartment_number', e.target.value)}
              className="form-input"
            />
          </div>

          {/* Additional Info */}
          <div>
            <label htmlFor="additional_info" className="block text-sm font-medium text-gray-700">
              Additional Information
            </label>
            <textarea
              id="additional_info"
              rows={3}
              value={formData.additional_info}
              onChange={(e) => handleChange('additional_info', e.target.value)}
              className="form-textarea"
              placeholder="Any additional details about the address..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
