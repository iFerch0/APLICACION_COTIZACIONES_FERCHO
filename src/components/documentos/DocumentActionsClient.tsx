"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Archive, ArchiveRestore, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { archiveDocument, deleteDocument } from "@/app/actions/documents";

interface Props {
  docId: string;
  tipo: "COTIZACION" | "FACTURA";
  estado: string;
  numero: string;
  hasFacturas: boolean;
}

export default function DocumentActionsClient({
  docId,
  tipo,
  estado: estadoInicial,
  numero,
  hasFacturas,
}: Props) {
  const router = useRouter();
  const [estado, setEstado] = useState(estadoInicial);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [isPendingArchive, startArchive] = useTransition();
  const [isPendingDelete, startDelete] = useTransition();

  const isArchived = estado === "ARCHIVADA";
  const editHref =
    tipo === "COTIZACION"
      ? `/cotizaciones/${docId}/editar`
      : `/facturas/${docId}/editar`;

  const handleArchive = () => {
    setArchiveError(null);
    const prev = estado;
    const optimistic = isArchived ? "BORRADOR" : "ARCHIVADA";
    setEstado(optimistic);
    startArchive(async () => {
      const result = await archiveDocument(docId);
      if (!result.success) {
        setEstado(prev);
        setArchiveError(result.error ?? "Error al archivar.");
      } else {
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteDocument(docId);
      if (!result.success) {
        setDeleteError(result.error ?? "Error al eliminar.");
      } else {
        setDeleteOpen(false);
        router.push("/documentos");
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Edit */}
        {!isArchived && (
          <Link
            href={editHref}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--surface-2)] hover:bg-[var(--border-0)] border border-[var(--border-0)] text-[var(--text-1)] hover:text-[var(--text-0)] text-xs font-semibold rounded-xl transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Link>
        )}

        {/* Archive toggle */}
        <button
          onClick={handleArchive}
          disabled={isPendingArchive}
          title={isArchived ? "Desarchivar" : "Archivar"}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--surface-2)] hover:bg-[var(--border-0)] border border-[var(--border-0)] text-[var(--text-1)] hover:text-[var(--text-0)] text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
        >
          {isArchived ? (
            <ArchiveRestore className="w-3.5 h-3.5" />
          ) : (
            <Archive className="w-3.5 h-3.5" />
          )}
          {isArchived ? "Desarchivar" : "Archivar"}
        </button>

        {/* Delete */}
        <button
          onClick={() => { setDeleteError(null); setDeleteOpen(true); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-xs font-semibold rounded-xl transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Eliminar
        </button>
      </div>

      {archiveError && (
        <p className="text-xs text-red-500 mt-1">{archiveError}</p>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-[var(--surface-1)] border-[var(--border-0)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-[var(--text-0)] font-bold">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-red-500" />
              </div>
              Eliminar {numero}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <p className="text-sm text-[var(--text-1)]">
              Esta acción no se puede deshacer. El documento y todos sus ítems serán eliminados permanentemente.
            </p>

            {tipo === "COTIZACION" && hasFacturas && (
              <div className="flex items-start gap-2.5 p-3 bg-amber-400/8 border border-amber-400/20 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--text-1)]">
                  Esta cotización tiene facturas asociadas y <strong>no puede eliminarse</strong>.
                  Elimina primero las facturas vinculadas.
                </p>
              </div>
            )}

            {tipo === "FACTURA" && (
              <div className="flex items-start gap-2.5 p-3 bg-[var(--surface-2)] border border-[var(--border-0)] rounded-xl">
                <AlertTriangle className="w-4 h-4 text-[var(--text-2)] shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--text-1)]">
                  Si esta factura se originó de una cotización, la cotización volverá al estado <strong>Borrador</strong>.
                </p>
              </div>
            )}

            {deleteError && (
              <p className="text-xs text-red-500 font-medium">{deleteError}</p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setDeleteOpen(false)}
              disabled={isPendingDelete}
              className="px-4 py-2 text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border-0)] text-[var(--text-1)] rounded-xl hover:bg-[var(--border-0)] transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isPendingDelete || (tipo === "COTIZACION" && hasFacturas)}
              className="px-4 py-2 text-xs font-bold bg-red-500 hover:bg-red-400 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPendingDelete ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
