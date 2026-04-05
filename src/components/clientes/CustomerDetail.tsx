"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Hash,
  FileText,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";
import {
  getCustomerById,
  deleteCustomer,
  type CustomerRow,
  type CustomerDetail as CustomerDetailType,
} from "@/app/actions/customers";

// ── Helpers ────────────────────────────────────────────────────────────────────

const estadoColor: Record<string, string> = {
  BORRADOR: "bg-[var(--surface-2)] text-[var(--text-2)]",
  ENVIADA: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  APROBADA: "bg-green-500/10 text-green-600 dark:text-green-400",
  RECHAZADA: "bg-red-500/10 text-red-500",
  ANULADA: "bg-[var(--surface-2)] text-[var(--text-2)] line-through",
  PAGADA: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

const tipoLabel: Record<string, string> = {
  COTIZACION: "Cotización",
  FACTURA: "Factura",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface CustomerDetailProps {
  customerId: string;
  onBack: () => void;
  onEdit: (customer: CustomerRow) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CustomerDetail({ customerId, onBack, onEdit }: CustomerDetailProps) {
  const [customer, setCustomer] = useState<CustomerDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await getCustomerById(customerId);
      if (!cancelled && result.success && result.customer) {
        setCustomer(result.customer);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const handleDelete = async () => {
    if (!customer) return;
    setDeleting(true);
    setDeleteError("");

    const result = await deleteCustomer(customer.id);
    if (result.success) {
      onBack();
    } else {
      setDeleteError(result.error ?? "Error al eliminar.");
      setDeleting(false);
    }
  };

  const fullName = customer
    ? [customer.nombres, customer.apellidos].filter(Boolean).join(" ")
    : "";

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--surface-2)] animate-pulse" />
          <div className="h-5 w-32 rounded bg-[var(--surface-2)] animate-pulse" />
        </div>
        <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 rounded bg-[var(--surface-2)] animate-pulse" style={{ width: `${60 + i * 10}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-10 h-10 text-[var(--text-2)] mb-3" />
        <p className="text-[var(--text-0)] font-semibold text-sm mb-1">
          Cliente no encontrado
        </p>
        <p className="text-[var(--text-2)] text-xs mb-4">
          El cliente que buscas no existe o fue eliminado.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium rounded-xl border border-[var(--border-0)] bg-[var(--surface-2)] text-[var(--text-1)] hover:text-[var(--text-0)] transition-all"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-[var(--border-0)] bg-[var(--surface-1)] text-[var(--text-1)] hover:text-[var(--text-0)] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-0)]">{fullName}</h2>
            <p className="text-xs text-[var(--text-2)]">
              Creado el {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onEdit({
                id: customer.id,
                nombres: customer.nombres,
                apellidos: customer.apellidos,
                direccion: customer.direccion,
                celular: customer.celular,
                email: customer.email,
                identificacion: customer.identificacion,
                notas: customer.notas,
                createdAt: customer.createdAt,
                _count: customer._count,
              })
            }
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-[var(--border-0)] bg-[var(--surface-2)] text-[var(--text-1)] hover:text-blue-500 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-[var(--border-0)] bg-[var(--surface-2)] text-[var(--text-2)] hover:text-red-500 hover:border-red-300 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar
          </button>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[var(--border-0)]">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
            <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-[var(--text-0)] font-bold text-sm">
              Información del Cliente
            </h3>
            <p className="text-[var(--text-2)] text-xs mt-0.5">
              {customer._count.documents} documento{customer._count.documents !== 1 ? "s" : ""} asociado{customer._count.documents !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {customer.identificacion && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                <Hash className="w-3.5 h-3.5 text-[var(--text-2)]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
                  Identificación
                </p>
                <p className="text-sm text-[var(--text-0)]">{customer.identificacion}</p>
              </div>
            </div>
          )}

          {customer.celular && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                <Phone className="w-3.5 h-3.5 text-[var(--text-2)]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
                  Celular
                </p>
                <p className="text-sm text-[var(--text-0)]">{customer.celular}</p>
              </div>
            </div>
          )}

          {customer.email && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5 text-[var(--text-2)]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
                  Email
                </p>
                <p className="text-sm text-[var(--text-0)]">{customer.email}</p>
              </div>
            </div>
          )}

          {customer.direccion && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[var(--text-2)]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
                  Dirección
                </p>
                <p className="text-sm text-[var(--text-0)]">{customer.direccion}</p>
              </div>
            </div>
          )}
        </div>

        {customer.notas && (
          <div className="mt-4 pt-4 border-t border-[var(--border-0)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)] mb-1">
              Notas
            </p>
            <p className="text-sm text-[var(--text-1)] leading-relaxed whitespace-pre-line">
              {customer.notas}
            </p>
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-5 pb-4 border-b border-[var(--border-0)]">
          <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h3 className="text-[var(--text-0)] font-bold text-sm">
              Documentos Asociados
            </h3>
            <p className="text-[var(--text-2)] text-xs mt-0.5">
              Cotizaciones y facturas para este cliente.
            </p>
          </div>
        </div>

        {customer.documents.length === 0 ? (
          <div className="py-10 flex flex-col items-center text-center px-6">
            <FileText className="w-8 h-8 text-[var(--text-2)] opacity-40 mb-2" />
            <p className="text-sm text-[var(--text-2)]">
              Sin documentos asociados.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-0)]/50">
            {customer.documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/${doc.tipo === "COTIZACION" ? "cotizaciones" : "facturas"}/${doc.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--surface-2)]/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0 group-hover:bg-[var(--surface-1)] transition-colors">
                    <FileText className="w-3.5 h-3.5 text-[var(--text-2)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-0)]">
                      {tipoLabel[doc.tipo] ?? doc.tipo} #{doc.numero}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-2)]">
                      <Clock className="w-3 h-3" />
                      {formatDate(doc.fecha)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[var(--text-0)]">
                    {formatCurrency(doc.totalFinal)}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      estadoColor[doc.estado] ?? estadoColor.BORRADOR
                    }`}
                  >
                    {doc.estado}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/10 backdrop-blur-xs"
            onClick={() => {
              if (!deleting) setShowDeleteConfirm(false);
            }}
          />
          <div className="relative bg-background border border-[var(--border-0)] rounded-2xl p-6 max-w-sm w-full shadow-xl z-10">
            <h3 className="text-[var(--text-0)] font-bold text-base mb-2">
              Eliminar cliente
            </h3>
            <p className="text-sm text-[var(--text-2)] mb-1 leading-relaxed">
              ¿Estás seguro de que deseas eliminar a <strong className="text-[var(--text-0)]">{fullName}</strong>?
            </p>
            <p className="text-xs text-[var(--text-2)] mb-5 leading-relaxed">
              Esta acción no se puede deshacer. Los clientes con documentos asociados no pueden ser eliminados.
            </p>

            {deleteError && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/8 border border-red-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm text-red-500 font-medium">{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-[var(--border-0)] bg-[var(--surface-2)] text-[var(--text-1)] hover:text-[var(--text-0)] disabled:opacity-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-bold rounded-xl bg-red-500 hover:bg-red-400 text-white disabled:opacity-60 transition-all"
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Eliminando...
                  </span>
                ) : (
                  "Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
