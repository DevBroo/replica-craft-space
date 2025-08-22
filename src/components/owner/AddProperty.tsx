import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PropertyWizard from './PropertyWizard';

interface AddPropertyProps {
  onBack: () => void;
}

const AddProperty: React.FC<AddPropertyProps> = ({ onBack }) => {
  // Redirect to the new comprehensive PropertyWizard
  return <PropertyWizard onBack={onBack} />;

};

            {/* Property Type */}
            <div>
              <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-2">
                Property Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const dropdown = document.getElementById('property-type-dropdown');
                    if (dropdown) {
                      dropdown.classList.toggle('hidden');
                    }
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm text-left"
                >
                  <span className={formData.propertyType ? 'text-gray-900' : 'text-gray-500'}>
                    {formData.propertyType || 'Select property type'}
                  </span>
                  <i className="fas fa-chevron-down text-gray-400"></i>
                </button>
                <div id="property-type-dropdown" className="hidden absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {propertyTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, propertyType: type }));
                        document.getElementById('property-type-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your property in detail..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-vertical"
                required
              />
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="pricing" className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Night <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="pricing"
                    name="pricing"
                    value={formData.pricing}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="1"
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                </div>
              </div>
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Guests <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-2">
                  Bedrooms <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-2">
                  Bathrooms <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required
                />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {amenitiesList.map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => handleAmenityChange(amenity)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Photo Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Property Photos
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <i className="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-700">Drag and drop your photos here</p>
                    <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(Array.from(e.target.files || []))}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer !rounded-button whitespace-nowrap"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Choose Files
                  </label>
                  <p className="text-xs text-gray-400">
                    Maximum file size: 10MB. Supported formats: JPG, PNG, GIF
                  </p>
                </div>
              </div>

              {/* Image Preview */}
              {uploadedImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Photos ({uploadedImages.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Property ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Property Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Property Status
              </label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleStatusToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    formData.status ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.status ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">
                  {formData.status ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Active properties will be visible to potential guests
              </p>
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer !rounded-button whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !isAuthenticated}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer !rounded-button whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Save Property
              </>
            )}
          </button>
        </div>

        {/* Authentication Warning */}
        {!isAuthenticated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <div className="flex">
              <i className="fas fa-exclamation-triangle text-yellow-400 mr-3 mt-0.5"></i>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Authentication Required</h3>
                <p className="text-sm text-yellow-700 mt-1">You must be logged in to save properties to the database.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AddProperty;