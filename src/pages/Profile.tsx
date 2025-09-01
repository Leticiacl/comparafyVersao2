// src/pages/Profile.tsx
import React, { useState, useEffect, ChangeEvent, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/services/firebase";
import { updateProfile, signOut } from "firebase/auth";
import { CameraIcon, ArrowUpRightIcon } from "@heroicons/react/24/outline";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/ui/PageHeader";
import InstallHowToModal from "@/components/ui/InstallHowToModal";
import TermsModal from "@/components/ui/TermsModal";
import { backfillPurchaseItemCategories } from "@/services/catalogBackfill";
import { toast } from "react-hot-toast";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const user = auth.currentUser!;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.displayName || "");
  const [editingName, setEditingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState<string>(() => user?.photoURL || "");
  const [howToOpen, setHowToOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [devBusy, setDevBusy] = useState(false);

  useEffect(() => {
    setName(user?.displayName || "");
    setPhotoURL(user?.photoURL || "");
  }, [user]);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await updateProfile(user, { photoURL: dataUrl });
      setPhotoURL(dataUrl);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleNameSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || !user) return;
    await updateProfile(user, { displayName: trimmed });
    setEditingName(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <main className="mx-auto w-full max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl bg-white px-4 md:px-6 pt-safe pb-[88px]">
      <PageHeader title="Perfil" />

      <div className="space-y-6">
        {/* Card avatar + nome */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-200">
                {photoURL && (
                  <img
                    src={photoURL}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                    onError={() => setPhotoURL("")}
                  />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 rounded-full bg-yellow-400 p-1 shadow"
                disabled={uploading}
                aria-label="Alterar foto"
              >
                <CameraIcon className="h-5 w-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            {/* Nome + e-mail */}
            <div className="min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded border px-2 py-1"
                  />
                  <button
                    onClick={handleNameSave}
                    className="text-sm font-semibold text-yellow-600"
                  >
                    Salvar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-lg font-semibold text-gray-900">
                    {name || "Visitante"}
                  </h2>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-sm text-yellow-600 underline"
                  >
                    Editar
                  </button>
                </div>
              )}
              <p className="text-sm text-gray-600">
                <span className="font-medium">E-mail:</span> {user?.email || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Itens clicáveis */}
        <button
          onClick={() => setHowToOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50"
        >
          <span>Como instalar no celular</span>
          <ArrowUpRightIcon className="h-5 w-5 text-gray-400" />
        </button>

        <button
          onClick={() => setTermsOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50"
        >
          <span>Termos de uso</span>
          <ArrowUpRightIcon className="h-5 w-5 text-gray-400" />
        </button>

        <button
          onClick={handleLogout}
          className="w-full rounded-2xl bg-gray-100 py-3 text-black hover:bg-gray-200"
        >
          Sair
        </button>
      </div>

      <BottomNav activeTab="profile" />

      {/* Modais */}
      <InstallHowToModal open={howToOpen} onClose={() => setHowToOpen(false)} />
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    </main>
  );
};

export default Profile;
