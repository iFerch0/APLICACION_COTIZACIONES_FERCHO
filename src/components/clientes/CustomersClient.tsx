"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  User,
  Mail,
  Phone,
  Hash,
  FileText,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import type { CustomerRow } from "@/app/actions/customers";
import { deleteCustomer } from "@/app/actions/customers";
import { CustomerForm } from "./CustomerForm";
import { CustomerDetail } from "./CustomerDetail";

// ── Helpers ──────────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mb-4">
        <User className="w-7 h-7 text-[var(--text-2)]" />
      </div>
      <p className="text-[var(--text-0)] font-semibold text-sm mb-1">
        {filtered ? "Sin resultados" : "Sin clientes aún"}
      </p>
      <p className="text-[var(--text-2)] text-xs max-w-xs leading-relaxed">
        {filtered
          ? "Prueba con otro término de búsqueda."
          : "Los clientes se agregan automáticamente al crear cotizaciones, o puedes agregarlos manualmente."}
      </p>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function CustomersClient({
  customers,
  total,
  currentPage,
  limit,
  searchQuery,
}: {
  customers: CustomerRow[];
  total: number;
  currentPage: number;
  limit: number;
  searchQuery: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchQuery);
  const [, startTransition] = useTransition();

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / limit);

  const updateSearch = useCallback(
    (value: string) => {
      setSearch(value);
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set("q", value);
        else params.delete("q");
        params.delete("page");
        router.push(`/clientes?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition]
  );

  const goToPage = useCallback(
    (page: number) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (page > 1) params.set("page", String(page));
        else params.delete("page");
        router.push(`/clientes?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition]
  );

  const handleDelete = async (id: string) => {
    const result = await deleteCustomer(id);
    if (result.success) {
      setDeletingId(null);
      router.refresh();
    } else {
      alert(result.error ?? "Error al eliminar");
      setDeletingId(null);
    }
  };

  const openEdit = (customer: CustomerRow) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  // If viewing detail
  if (viewingCustomerId) {
    return (
      <CustomerDetail
        customerId={viewingCustomerId}
        onBack={() => setViewingCustomerId(null)}
        onEdit={(customer) => {
          setViewingCustomerId(null);
          openEdit(customer);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-2)] pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, identificación..."
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            className="w-full bg-[var(--surface-1)] border border-[var(--border-0)] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--text-0)] placeholder-[var(--text-2)] focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 outline-none transition-all"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-[oklch(0.090_0.025_255)] text-sm font-bold rounded-xl transition-all shadow-md shadow-amber-400/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Results count */}
      {total > 0 && (
        <div className="text-xs text-[var(--text-2)]">
          {total} {total === 1 ? "cliente" : "clientes"} encontrado{total === 1 ? "" : "s"}
        </div>
      )}

      {/* Table / Cards */}
      <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl overflow-hidden">
        {customers.length === 0 ? (
          <EmptyState filtered={search.trim() !== ""} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-0)]">
                    <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)]">
                      Nombre
                    </th>
                    <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)]">
                      Identificación
                    </th>
                    <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)]">
                      Celular
                    </th>
                    <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)]">
                      Email
                    </th>
                    <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)] text-center">
                      Docs
                    </th>
                    <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)] text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-[var(--border-0)]/50 last:border-0 hover:bg-[var(--surface-2)]/50 transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-medium text-[var(--text-0)]">
                          {customer.nombres}{customer.apellidos ? ` ${customer.apellidos}` : ""}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="text-sm text-[var(--text-1)]">
                          {customer.identificacion || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="text-sm text-[var(--text-1)]">
                          {customer.celular || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="text-sm text-[var(--text-1)] truncate block max-w-[180px]">
                          {customer.email || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${customer._count.documents > 0 ? "text-amber-500" : "text-[var(--text-2)]"}`}>
                          <FileText className="w-3 h-3" />
                          {customer._count.documents}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setViewingCustomerId(customer.id)}
                            title="Ver detalle"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text-0)] transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(customer)}
                            title="Editar"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-2)] hover:text-blue-500 transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(customer.id)}
                            title="Eliminar"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-2)] hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[var(--border-0)]/50">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 space-y-2.5 hover:bg-[var(--surface-2)]/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-[var(--text-0)]">
                        {customer.nombres}{customer.apellidos ? ` ${customer.apellidos}` : ""}
                      </div>
                      {customer.identificacion && (
                        <div className="text-xs text-[var(--text-2)] mt-0.5 flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {customer.identificacion}
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${customer._count.documents > 0 ? "bg-amber-400/10 text-amber-500" : "bg-[var(--surface-2)] text-[var(--text-2)]"}`}>
                      <FileText className="w-3 h-3" />
                      {customer._count.documents}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {customer.celular && (
                      <div className="flex items-center gap-1.5 text-[var(--text-1)]">
                        <Phone className="w-3 h-3 text-[var(--text-2)]" />
                        <span className="truncate">{customer.celular}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-1.5 text-[var(--text-1)]">
                        <Mail className="w-3 h-3 text-[var(--text-2)]" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setViewingCustomerId(customer.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--surface-2)] text-[var(--text-1)] hover:text-[var(--text-0)] transition-all"
                    >
                      <Eye className="w-3 h-3" />
                      Ver
                    </button>
                    <button
                      onClick={() => openEdit(customer)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--surface-2)] text-[var(--text-1)] hover:text-blue-500 transition-all"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      onClick={() => setDeletingId(customer.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-[var(--border-0)] flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
                  Página {currentPage} de {totalPages} · {total} clientes
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border-0)] bg-[var(--surface-2)] text-[var(--text-1)] hover:text-[var(--text-0)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Anterior
                  </button>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border-0)] bg-[var(--surface-2)] text-[var(--text-1)] hover:text-[var(--text-0)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Siguiente
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onClose={closeForm}
          onSaved={() => {
            closeForm();
            router.refresh();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/10 backdrop-blur-xs"
            onClick={() => setDeletingId(null)}
          />
          <div className="relative bg-background border border-[var(--border-0)] rounded-2xl p-6 max-w-sm w-full shadow-xl z-10">
            <h3 className="text-[var(--text-0)] font-bold text-base mb-2">
              Eliminar cliente
            </h3>
            <p className="text-sm text-[var(--text-2)] mb-5 leading-relaxed">
              ¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-[var(--border-0)] bg-[var(--surface-2)] text-[var(--text-1)] hover:text-[var(--text-0)] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 text-sm font-bold rounded-xl bg-red-500 hover:bg-red-400 text-white transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
