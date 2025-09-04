import React from 'react';
import { useNavigate } from 'react-router-dom';

const AgentLogin: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Redirect to owner login since agent functionality is disabled
    navigate('/owner/login', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Agent Portal Disabled</h1>
        <p className="text-muted-foreground mb-4">
          Agent functionality has been consolidated with the owner portal.
        </p>
        <p className="text-muted-foreground">Redirecting to owner portal...</p>
      </div>
    </div>
  );
};

export default AgentLogin;
