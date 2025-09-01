import React from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import BottomNav from "../components/BottomNav";
import { useData } from "../context/DataContext";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { lists = [], purchases = [] } = useData();

  const latestLists = lists.slice(0, 3);
  const latestPurchases = purchases.slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl bg-white px-4 md:px-6 pt-safe pb-[88px]">
      <PageHeader title="Início" />

      {/* ===== Últimas listas ===== */}
      <section className="mt-3 sm:mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Últimas listas</h2>
          <Link to="/lists" className="text-sm text-yellow-600 hover:underline">ver todas</Link>
        </div>

        {/* CTA grande (navega para /lists e abre o modal automaticamente) */}
        <Link
          to="/lists?new=1"
          className="mb-3 block w-full rounded-2xl bg-yellow-500 px-4 py-3 text-center font-semibold text-black shadow hover:brightness-95"
        >
          + Nova lista
        </Link>

        {latestLists.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-gray-600">
            Você ainda não criou listas.
          </div>
        ) : (
          <div className="space-y-3">
            {latestLists.map((l) => (
              <button
                key={l.id}
                onClick={() => navigate(`/lists/${l.id}`)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-gray-900">{l.nome || "Lista"}</div>
                  <div className="text-sm text-gray-500">
                    {(l.itens?.filter(i => i.comprado).length || 0)}/{(l.itens?.length || 0)} itens
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ===== Últimas compras ===== */}
      <section className="mt-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Últimas compras</h2>
          <Link to="/purchases" className="text-sm text-yellow-600 hover:underline">ver todas</Link>
        </div>

        {/* CTA grande (rota correta) */}
        <Link
          to="/purchases/new"
          className="mb-3 block w-full rounded-2xl bg-yellow-500 px-4 py-3 text-center font-semibold text-black shadow hover:brightness-95"
        >
          + Nova compra
        </Link>

        {latestPurchases.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-gray-600">
            Nenhuma compra cadastrada ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {latestPurchases.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/purchases/${p.id}`)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-gray-900">{p.name || "Compra"}</div>
                  <div className="text-sm text-gray-500">
                    {p.market || "—"} · {(p.itens || []).length} itens
                  </div>
                </div>
                <div className="shrink-0 text-right font-semibold text-gray-900">
                  {(Number(p.total) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <BottomNav activeTab="home" />
    </main>
  );
};

export default Dashboard;
