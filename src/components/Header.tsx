// src/components/Header.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-4 py-4 bg-white shadow-sm">
      <button onClick={() => navigate(-1)} className="text-gray-500 text-xl">
        ←
      </button>
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      <img src="/LOGO_REDUZIDA.png" alt="Logo" className="w-8 h-8" />
    </header>
  );
};

export default Header;
