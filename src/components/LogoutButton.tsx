// src/components/LogoutButton.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';

const LogoutButton: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="text-red-500 underline text-sm text-right"
    >
      Sair do Comparafy.
    </button>
  );
};

export default LogoutButton;
