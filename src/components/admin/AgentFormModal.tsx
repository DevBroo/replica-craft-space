
import React, { useState, useEffect } from 'react';
import { X, Upload, Eye, EyeOff } from 'lucide-react';
import { agentService } from '../../lib/agentService';
import { toast } from 'sonner';

interface AgentFormModalProps {
  agent?: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  mode: 'add' | 'edit' | 'view';
}

const AgentFormModal: React.FC<AgentFormModalProps> = ({
  agent,
  isOpen,
  onClose,
  onSave,
  mode
}) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    // Basic Information
    full_name: '',
    email: '',
    phone: '',
    password: '',
    
    // Extended Information
    coverage_area: '',
    aadhar_number: '',
    pan_number: '',
    joining_date: new Date().toISOString().split('T')[0],
    status: 'active',
    notes: '',
    commission_rate: 5,
    commission_type: 'percentage',
    
    // Bank Details
    account_holder_name: '',
    bank_name: '',
    branch_name: '',
    account_number: '',
    ifsc_code: '',
    account_type: 'Savings',
    bank_pan_number: '',
    upi_id: '',
    micr_code: ''
  });

  useEffect(() => {
    if (agent && mode !== 'add') {
      setFormData({
        full_name: agent.full_name || '',
        email: agent.email || '',
        phone: agent.phone || '',
        password: '',
        
        coverage_area: agent.agent_profile?.coverage_area || '',
        aadhar_number: agent.agent_profile?.aadhar_number || '',
        pan_number: agent.agent_profile?.pan_number || '',
        joining_date: agent.agent_profile?.joining_date || new Date().toISOString().split('T')[0],
        status: agent.agent_profile?.status || 'active',
        notes: agent.agent_profile?.notes || '',
        commission_rate: agent.commission_rate || agent.agent_profile?.commission_config?.rate || 5,
        commission_type: agent.agent_profile?.commission_config?.type || 'percentage',
        
        account_holder_name: agent.bank_details?.account_holder_name || '',
        bank_name: agent.bank_details?.bank_name || '',
        branch_name: agent.bank_details?.branch_name || '',
        account_number: agent.bank_details?.account_number || '',
        ifsc_code: agent.bank_details?.ifsc_code || '',
        account_type: agent.bank_details?.account_type || 'Savings',
        bank_pan_number: agent.bank_details?.pan_number || '',
        upi_id: agent.bank_details?.upi_id || '',
        micr_code: agent.bank_details?.micr_code || ''
      });
    } else if (mode === 'add') {
      // Reset form for new agent
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        coverage_area: '',
        aadhar_number: '',
        pan_number: '',
        joining_date: new Date().toISOString().split('T')[0],
        status: 'active',
        notes: '',
        commission_rate: 5,
        commission_type: 'percentage',
        account_holder_name: '',
        bank_name: '',
        branch_name: '',
        account_number: '',
        ifsc_code: '',
        account_type: 'Savings',
        bank_pan_number: '',
        upi_id: '',
        micr_code: ''
      });
    }
  }, [agent, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    setLoading(true);
    try {
      if (mode === 'add') {
        await agentService.addAgent({
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone,
          coverage_area: formData.coverage_area,
          commission_rate: formData.commission_rate / 100
        });
        toast.success('Agent added successfully!');
      } else if (mode === 'edit' && agent) {
        await agentService.updateAgentProfile(agent.id, {
          basic: {
            full_name: formData.full_name,
            phone: formData.phone,
            commission_rate: formData.commission_rate / 100,
            is_active: formData.status === 'active'
          },
          extended: {
            coverage_area: formData.coverage_area,
            aadhar_number: formData.aadhar_number,
            pan_number: formData.pan_number,
            joining_date: formData.joining_date,
            status: formData.status,
            notes: formData.notes,
            commission_config: {
              type: formData.commission_type,
              rate: formData.commission_rate
            }
          },
          bank: formData.account_holder_name && formData.bank_name && formData.account_number && formData.ifsc_code ? {
            account_holder_name: formData.account_holder_name,
            bank_name: formData.bank_name,
            branch_name: formData.branch_name,
            account_number: formData.account_number,
            ifsc_code: formData.ifsc_code,
            account_type: formData.account_type,
            pan_number: formData.bank_pan_number,
            upi_id: formData.upi_id,
            micr_code: formData.micr_code
          } : undefined
        });
        toast.success('Agent updated successfully!');
      }
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving agent:', error);
      toast.error(error.message || 'Failed to save agent');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  const isReadOnly = mode === 'view';
  const title = mode === 'add' ? 'Add New Agent' : mode === 'edit' ? 'Edit Agent' : 'Agent Details';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Basic Information
            </button>
            <button
              onClick={() => setActiveTab('extended')}
              className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                activeTab === 'extended'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Extended Details
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                activeTab === 'bank'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Bank Details
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <form onSubmit={handleSubmit}>
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                      placeholder="Enter agent's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isReadOnly || mode === 'edit'}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                      placeholder="Enter mobile number"
                    />
                  </div>

                  {mode === 'add' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Auto-generated password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coverage Area / Region
                    </label>
                    <input
                      type="text"
                      name="coverage_area"
                      value={formData.coverage_area}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                      placeholder="e.g., Mumbai, Delhi NCR"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50 cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commission Rate (%)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      name="commission_rate"
                      value={formData.commission_rate}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                      placeholder="5.0"
                    />
                    <select
                      name="commission_type"
                      value={formData.commission_type}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50 cursor-pointer"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Extended Details Tab */}
            {activeTab === 'extended' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      name="aadhar_number"
                      value={formData.aadhar_number}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      maxLength={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                      placeholder="Enter 12-digit Aadhaar number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      name="pan_number"
                      value={formData.pan_number}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      maxLength={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                      placeholder="Enter PAN number"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      name="joining_date"
                      value={formData.joining_date}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                    placeholder="Add any additional notes about the agent..."
                  />
                </div>
              </div>
            )}

            {/* Bank Details Tab */}
            {activeTab === 'bank' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      name="account_holder_name"
                      value={formData.account_holder_name}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                      placeholder="Enter account holder name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                      placeholder="Enter bank name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      name="branch_name"
                      value={formData.branch_name}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                      placeholder="Enter branch name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="account_number"
                      value={formData.account_number}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                      placeholder="Enter account number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      name="ifsc_code"
                      value={formData.ifsc_code}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      maxLength={11}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                      placeholder="Enter IFSC code"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Type
                    </label>
                    <select
                      name="account_type"
                      value={formData.account_type}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50 cursor-pointer"
                    >
                      <option value="Savings">Savings</option>
                      <option value="Current">Current</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PAN Number (for Bank)
                    </label>
                    <input
                      type="text"
                      name="bank_pan_number"
                      value={formData.bank_pan_number}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      maxLength={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                      placeholder="Enter PAN number"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UPI ID (Optional)
                    </label>
                    <input
                      type="text"
                      name="upi_id"
                      value={formData.upi_id}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                      placeholder="Enter UPI ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MICR Code (Optional)
                    </label>
                    <input
                      type="text"
                      name="micr_code"
                      value={formData.micr_code}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      maxLength={9}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                      placeholder="Enter MICR code"
                    />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        {!isReadOnly && (
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : mode === 'add' ? 'Add Agent' : 'Update Agent'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentFormModal;
