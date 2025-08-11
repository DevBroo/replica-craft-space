import React from 'react';
import { Link } from 'react-router-dom';

const TestAgentLogin: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Agent Login Test Page</h1>
        <p className="mb-4">This is a test page to verify routing works.</p>
        <Link 
          to="/" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default TestAgentLogin;
