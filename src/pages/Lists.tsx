import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import BottomNav from "../components/BottomNav";
import ListaCard from "../components/ListaCard";
import NewListModal from "../components/ui/NewListModal";
import { useData } from "../context/DataContext";

const Lists: React.FC = () => {
  const navigate = useNavigate();
  const { lists = [], createList } = useData();
  const [open, setOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Abre modal automaticamente quando vier de /lists?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setOpen(true);
      const params = new URLSearchParams(searchParams);
      params.delete("new");
      setSearchParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalItens = useMemo(
    () => lists.reduce((acc, l) => acc + (l.itens?.length || 0), 0),
    [lists]
  );

  return (
    <main className="mx-auto w-full max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl bg-white px-4 md:px-6 pt-safe pb-[88px]">
      <PageHeader title="Listas" />

      {/* Botão NOVA LISTA */}
      <button
        onClick={() => setOpen(true)}
        className="mb-3 w-full rounded-2xl bg-yellow-500 px-4 py-3 font-semibold text-black shadow hover:brightness-95"
      >
        + Nova lista
      </button>

      {lists.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-gray-600">
          Você ainda não tem listas.
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map((l) => (
            <ListaCard key={l.id} list={l} onClick={() => navigate(`/lists/${l.id}`)} />
          ))}
        </div>
      )}

      <NewListModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onCreate={async (name) => {
          const created = await createList(name);
          setOpen(false);
          const id = (created as any)?.id;
          if (id) navigate(`/lists/${id}`);
        }}
      />

      <BottomNav activeTab="lists" />
    </main>
  );
};

export default Lists;
