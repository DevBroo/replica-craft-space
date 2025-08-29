
import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, Save, User, Building, CreditCard, FileText, Bell, Key, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { bankingService } from '@/lib/bankingService';
import { PropertyOwner, adminService } from '@/lib/adminService';
import { toast } from 'sonner';

interface OwnerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  owner?: PropertyOwner | null;
  mode: 'add' | 'edit' | 'view';
  onSave: () => void;
}

interface OwnerProfile {
  company_name?: string;
  logo_url?: string;
  gst_number?: string;
  pan_number?: string;
  aadhar_number?: string;
  office_address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
  is_office_same_as_property?: boolean;
  property_types_offered?: string[];
  documents?: Record<string, string>;
}

interface BankDetails {
  account_holder_name?: string;
  bank_name?: string;
  branch_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_type?: string;
  pan_number?: string;
  upi_id?: string;
  micr_code?: string;
}

const PROPERTY_TYPES = ['Farmhouse', 'Villa', 'Homestay', 'Picnic Spot', 'Day Picnic'];
const ACCOUNT_TYPES = ['Savings', 'Current', 'NRE', 'NRO'];

const OwnerFormModal: React.FC<OwnerFormModalProps> = ({
  isOpen,
  onClose,
  owner,
  mode,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Basic profile data
  const [basicData, setBasicData] = useState({
    full_name: '',
    email: '',
    phone: '',
    commission_rate: 0.10,
    is_active: true
  });

  // Extended profile data
  const [profileData, setProfileData] = useState<OwnerProfile>({
    company_name: '',
    gst_number: '',
    pan_number: '',
    aadhar_number: '',
    office_address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: ''
    },
    is_office_same_as_property: false,
    property_types_offered: [],
    documents: {}
  });

  // Bank details
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    account_holder_name: '',
    bank_name: '',
    branch_name: '',
    account_number: '',
    ifsc_code: '',
    account_type: 'Savings',
    pan_number: '',
    upi_id: '',
    micr_code: ''
  });

  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen && owner && mode !== 'add') {
      loadOwnerData();
    } else if (isOpen && mode === 'add') {
      resetForm();
    }
  }, [isOpen, owner, mode]);

  const resetForm = () => {
    setBasicData({
      full_name: '',
      email: '',
      phone: '',
      commission_rate: 0.10,
      is_active: true
    });
    setProfileData({
      company_name: '',
      gst_number: '',
      pan_number: '',
      aadhar_number: '',
      office_address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postal_code: ''
      },
      is_office_same_as_property: false,
      property_types_offered: [],
      documents: {}
    });
    setBankDetails({
      account_holder_name: '',
      bank_name: '',
      branch_name: '',
      account_number: '',
      ifsc_code: '',
      account_type: 'Savings',
      pan_number: '',
      upi_id: '',
      micr_code: ''
    });
  };

  const loadOwnerData = async () => {
    if (!owner) return;
    
    setLoading(true);
    try {
      // Load basic data
      setBasicData({
        full_name: owner.full_name || '',
        email: owner.email || '',
        phone: owner.phone || '',
        commission_rate: owner.commission_rate || 0.10,
        is_active: owner.is_active
      });

      // Load extended profile
      const { data: profile } = await supabase
        .from('owner_profiles')
        .select('*')
        .eq('user_id', owner.id)
        .single();

      if (profile) {
        setProfileData({
          company_name: profile.company_name || '',
          logo_url: profile.logo_url || '',
          gst_number: profile.gst_number || '',
          pan_number: profile.pan_number || '',
          aadhar_number: profile.aadhar_number || '',
          office_address: typeof profile.office_address === 'object' && profile.office_address !== null
            ? profile.office_address as {
                line1?: string;
                line2?: string;
                city?: string;
                state?: string;
                postal_code?: string;
              }
            : {
                line1: '',
                line2: '',
                city: '',
                state: '',
                postal_code: ''
              },
          is_office_same_as_property: profile.is_office_same_as_property || false,
          property_types_offered: profile.property_types_offered || [],
          documents: typeof profile.documents === 'object' && profile.documents !== null
            ? profile.documents as Record<string, string>
            : {}
        });
      }

      // Load bank details securely
      try {
        const bankData = await bankingService.getBankDetails(owner.id);
        
        if (bankData) {
          setBankDetails({
            account_holder_name: bankData.account_holder_name || '',
            bank_name: bankData.bank_name || '',
            branch_name: bankData.branch_name || '',
            account_number: bankData.account_number_masked || '',
            ifsc_code: bankData.ifsc_code || '',
            account_type: bankData.account_type || 'Savings',
            pan_number: bankData.pan_number_masked || '',
            upi_id: bankData.upi_id_masked || '',
            micr_code: bankData.micr_code || ''
          });
        }
      } catch (error) {
        console.error('Error loading bank details:', error);
        toast.error('Failed to load bank details');
      }
    } catch (error) {
      console.error('Error loading owner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'pan' | 'aadhar') => {
    if (!owner && mode !== 'add') return;
    
    setUploading(prev => ({ ...prev, [type]: true }));
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${owner?.id || 'temp'}/${type}.${fileExt}`;
      const bucket = type === 'logo' ? 'owner-logos' : 'owner-docs';
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (type === 'logo') {
        setProfileData(prev => ({ ...prev, logo_url: publicUrl }));
      } else {
        setProfileData(prev => ({
          ...prev,
          documents: { ...prev.documents, [type]: publicUrl }
        }));
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      alert(`Failed to upload ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSave = async () => {
    if (mode === 'view') return;
    
    setSaving(true);
    try {
      if (mode === 'add') {
        // Create new owner via admin service
        await adminService.addPropertyOwner({
          email: basicData.email,
          full_name: basicData.full_name,
          phone: basicData.phone
        });
        
        alert('Owner invitation sent successfully!');
        onClose();
        onSave();
        return;
      }

      if (!owner) return;

      // Update basic profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: basicData.full_name,
          phone: basicData.phone,
          commission_rate: basicData.commission_rate,
          is_active: basicData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', owner.id);

      if (profileError) throw profileError;

      // Upsert owner profile
      const { error: ownerProfileError } = await supabase
        .from('owner_profiles')
        .upsert({
          user_id: owner.id,
          ...profileData,
          updated_at: new Date().toISOString()
        });

      if (ownerProfileError) throw ownerProfileError;

      // Save bank details securely
      if (bankDetails.account_holder_name && bankDetails.bank_name && bankDetails.account_number && bankDetails.ifsc_code) {
        try {
          await bankingService.saveBankDetails(owner.id, {
            account_holder_name: bankDetails.account_holder_name,
            bank_name: bankDetails.bank_name,
            branch_name: bankDetails.branch_name,
            account_number: bankDetails.account_number,
            ifsc_code: bankDetails.ifsc_code,
            account_type: bankDetails.account_type,
            pan_number: bankDetails.pan_number,
            upi_id: bankDetails.upi_id || '',
            micr_code: bankDetails.micr_code || ''
          });
        } catch (error) {
          console.error('Error saving bank details:', error);
          throw new Error('Failed to save bank details: ' + (error as Error).message);
        }
      }

      // Log activity
      await supabase.rpc('log_owner_activity_fn', {
        p_owner_id: owner.id,
        p_action: 'profile_updated',
        p_actor_id: (await supabase.auth.getUser()).data.user?.id,
        p_actor_type: 'admin',
        p_metadata: { updated_fields: ['profile', 'bank_details'] }
      });

      alert('Owner details updated successfully!');
      onClose();
      onSave();
    } catch (error) {
      console.error('Error saving owner:', error);
      alert('Failed to save owner details: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handlePropertyTypeToggle = (type: string) => {
    setProfileData(prev => ({
      ...prev,
      property_types_offered: prev.property_types_offered?.includes(type)
        ? prev.property_types_offered.filter(t => t !== type)
        : [...(prev.property_types_offered || []), type]
    }));
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'business', label: 'Business Details', icon: Building },
    { id: 'bank', label: 'Bank Details', icon: CreditCard },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'actions', label: 'Actions', icon: Bell }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading owner details...</span>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {mode === 'add' ? 'Add New Owner' : mode === 'edit' ? 'Edit Owner' : 'Owner Details'}
                </h3>
                {owner && (
                  <p className="text-sm text-gray-500 mt-1">
                    ID: {owner.id.substring(0, 8)}... • Created: {new Date(owner.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={basicData.full_name}
                        onChange={(e) => setBasicData(prev => ({ ...prev, full_name: e.target.value }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={basicData.email}
                        onChange={(e) => setBasicData(prev => ({ ...prev, email: e.target.value }))}
                        disabled={mode === 'view' || mode === 'edit'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={basicData.phone}
                        onChange={(e) => setBasicData(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Commission Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={basicData.commission_rate}
                        onChange={(e) => setBasicData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 0 }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="0.10"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Example: 0.20 = 20% commission (owner gets 80%)
                      </p>
                    </div>
                  </div>
                  
                  {mode !== 'add' && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={basicData.is_active}
                        onChange={(e) => setBasicData(prev => ({ ...prev, is_active: e.target.checked }))}
                        disabled={mode === 'view'}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                        Active Status
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Business Details Tab */}
              {activeTab === 'business' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company/Brand Name
                      </label>
                      <input
                        type="text"
                        value={profileData.company_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, company_name: e.target.value }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Enter company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GST Number
                      </label>
                      <input
                        type="text"
                        value={profileData.gst_number}
                        onChange={(e) => setProfileData(prev => ({ ...prev, gst_number: e.target.value }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Enter GST number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        value={profileData.pan_number}
                        onChange={(e) => setProfileData(prev => ({ ...prev, pan_number: e.target.value }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Enter PAN number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aadhar Number
                      </label>
                      <input
                        type="text"
                        value={profileData.aadhar_number}
                        onChange={(e) => setProfileData(prev => ({ ...prev, aadhar_number: e.target.value }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Enter Aadhar number"
                      />
                    </div>
                  </div>

                  {/* Office Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Office Address
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={profileData.office_address?.line1 || ''}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          office_address: { ...prev.office_address, line1: e.target.value }
                        }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Address Line 1"
                      />
                      <input
                        type="text"
                        value={profileData.office_address?.line2 || ''}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          office_address: { ...prev.office_address, line2: e.target.value }
                        }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Address Line 2"
                      />
                      <input
                        type="text"
                        value={profileData.office_address?.city || ''}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          office_address: { ...prev.office_address, city: e.target.value }
                        }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={profileData.office_address?.state || ''}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          office_address: { ...prev.office_address, state: e.target.value }
                        }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="State"
                      />
                      <input
                        type="text"
                        value={profileData.office_address?.postal_code || ''}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          office_address: { ...prev.office_address, postal_code: e.target.value }
                        }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Postal Code"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_office_same_as_property"
                      checked={profileData.is_office_same_as_property}
                      onChange={(e) => setProfileData(prev => ({ ...prev, is_office_same_as_property: e.target.checked }))}
                      disabled={mode === 'view'}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_office_same_as_property" className="ml-2 text-sm text-gray-700">
                      Office address is same as property address
                    </label>
                  </div>

                  {/* Property Types */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Types Offered
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {PROPERTY_TYPES.map(type => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={profileData.property_types_offered?.includes(type) || false}
                            onChange={() => handlePropertyTypeToggle(type)}
                            disabled={mode === 'view'}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Details Tab */}
              {activeTab === 'bank' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={bankDetails.account_holder_name}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, account_holder_name: e.target.value }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Enter account holder name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankDetails.bank_name}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, bank_name: e.target.value }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Enter bank name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Branch Name
                      </label>
                      <input
                        type="text"
                        value={bankDetails.branch_name}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, branch_name: e.target.value }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Enter branch name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={bankDetails.account_number}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, account_number: e.target.value }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Enter account number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={bankDetails.ifsc_code}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Enter IFSC code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Type
                      </label>
                      <select
                        value={bankDetails.account_type}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, account_type: e.target.value }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      >
                        {ACCOUNT_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        value={bankDetails.pan_number}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, pan_number: e.target.value.toUpperCase() }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Enter PAN number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        UPI ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={bankDetails.upi_id}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, upi_id: e.target.value }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Enter UPI ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        MICR Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={bankDetails.micr_code}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, micr_code: e.target.value }))}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        placeholder="Enter MICR code"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Logo
                    </label>
                    <div className="flex items-center space-x-4">
                      {profileData.logo_url && (
                        <img
                          src={profileData.logo_url}
                          alt="Company Logo"
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                      )}
                      {mode !== 'view' && (
                        <div>
                          <input
                            type="file"
                            id="logo-upload"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, 'logo');
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="logo-upload"
                            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                          >
                            {uploading.logo ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            Upload Logo
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['pan', 'aadhar'].map(docType => (
                      <div key={docType}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {docType === 'pan' ? 'PAN Card' : 'Aadhar Card'}
                        </label>
                        <div className="space-y-2">
                          {profileData.documents?.[docType] && (
                            <a
                              href={profileData.documents[docType]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View {docType.toUpperCase()} Document
                            </a>
                          )}
                          {mode !== 'view' && (
                            <div>
                              <input
                                type="file"
                                id={`${docType}-upload`}
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file, docType as 'pan' | 'aadhar');
                                }}
                                className="hidden"
                              />
                              <label
                                htmlFor={`${docType}-upload`}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                              >
                                {uploading[docType] ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4 mr-2" />
                                )}
                                Upload {docType.toUpperCase()}
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Tab */}
              {activeTab === 'actions' && owner && mode !== 'add' && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-yellow-800 mb-2">Account Actions</h4>
                    <p className="text-sm text-yellow-700 mb-4">
                      These actions will affect the owner's account access and should be used carefully.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div>
                          <h5 className="font-medium text-gray-800">Reset Password</h5>
                          <p className="text-sm text-gray-600">Send a password reset email to the owner</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (confirm(`Send password reset email to ${owner.email}?`)) {
                              try {
                                const { error } = await supabase.auth.resetPasswordForEmail(owner.email!, {
                                  redirectTo: window.location.origin + '/owner/reset-password'
                                });
                                if (error) throw error;
                                alert('Password reset email sent successfully!');
                              } catch (error) {
                                console.error('Error sending reset email:', error);
                                alert('Failed to send password reset email');
                              }
                            }
                          }}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Key className="w-4 h-4 mr-2" />
                          Reset Password
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div>
                          <h5 className="font-medium text-gray-800">Force Login Refresh</h5>
                          <p className="text-sm text-gray-600">Force the owner to re-authenticate on next login</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (confirm('Force login refresh for this owner?')) {
                              // This would typically involve invalidating their session/tokens
                              // For now, we'll just log an activity
                              try {
                                await supabase.rpc('log_owner_activity_fn', {
                                  p_owner_id: owner.id,
                                  p_action: 'force_logout',
                                  p_actor_id: (await supabase.auth.getUser()).data.user?.id,
                                  p_actor_type: 'admin',
                                  p_metadata: { reason: 'admin_forced_refresh' }
                                });
                                alert('Login refresh scheduled for this owner');
                              } catch (error) {
                                console.error('Error logging activity:', error);
                                alert('Failed to schedule login refresh');
                              }
                            }
                          }}
                          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Force Refresh
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <div className="flex items-center space-x-3">
                {mode !== 'view' && mode !== 'add' && owner && (
                  <button
                    onClick={() => {
                      // TODO: Implement send notification functionality
                      alert('Send notification functionality to be implemented');
                    }}
                    className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Send Notification
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {mode === 'view' ? 'Close' : 'Cancel'}
                </button>
                {mode !== 'view' && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {mode === 'add' ? 'Add Owner' : 'Save Changes'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerFormModal;
