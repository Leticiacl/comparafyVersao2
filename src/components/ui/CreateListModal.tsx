// src/components/ui/CreateListModal.tsx
import React, { useState } from "react";

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

const CreateListModal: React.FC<CreateListModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim());
      setName("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-xl p-6 w-11/12 max-w-sm">
        <h2 className="text-lg font-semibold mb-4 text-center">Nova Lista</h2>
        <input
          type="text"
          placeholder="Digite o nome da lista"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <div className="flex justify-end gap-2">
          <button
            className="bg-gray-200 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-300"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="bg-yellow-400 text-black font-semibold rounded-lg px-4 py-2 hover:bg-yellow-500"
            onClick={handleCreate}
          >
            Criar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateListModal;
