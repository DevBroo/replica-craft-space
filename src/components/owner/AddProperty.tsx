import React from 'react';
import PropertyWizard from './PropertyWizard';

interface AddPropertyProps {
  onBack: () => void;
}

const AddProperty: React.FC<AddPropertyProps> = ({ onBack }) => {
  // Redirect to the new comprehensive PropertyWizard
  return <PropertyWizard onBack={onBack} />;
};

export default AddProperty;