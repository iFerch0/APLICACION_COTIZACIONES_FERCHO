"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2, Printer } from "lucide-react";
import { ItemInput, calcularItem, calcularTotalesDocumento } from "@/lib/calculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { searchCustomers, createCustomer } from "@/app/actions/customers";
import { saveDocument } from "@/app/actions/documents";

const ClientPDFViewer = dynamic(() => import("@/components/pdf/ClientPDFViewer"), {
  ssr: false,
});

export interface DocumentFormProps {
  tipoDocumento?: "COTIZACION" | "FACTURA";
}

export default function CotizacionForm({ tipoDocumento = "COTIZACION" }: DocumentFormProps) {
  const [clienteInfo, setClienteInfo] = useState({ nombres: "", email: "", notas: "" });
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formatoPDF, setFormatoPDF] = useState<"completo" | "resumido" | "concatenado">("completo");
  const [items, setItems] = useState<ItemInput[]>([
    {
      id: "1",
      descripcion: "",
      cantidad: 1,
      precioUnitarioBase: 0,
      aplicaTax: false,
      taxUnitario: 0,
      envioUnitario: 0,
      promocionEnvioUnitario: 0,
      importacionUnitario: 0,
      aplicaAmazon: false,
    },
  ]);

  const [aplica4x1000Global, setAplica4x1000Global] = useState(false);

  const agregarItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        descripcion: "",
        cantidad: 1,
        precioUnitarioBase: 0,
        aplicaTax: false,
        taxUnitario: 0,
        envioUnitario: 0,
        promocionEnvioUnitario: 0,
        importacionUnitario: 0,
        aplicaAmazon: false,
      },
    ]);
  };

  const eliminarItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = <K extends keyof ItemInput>(
    id: string,
    field: K,
    value: ItemInput[K]
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const calculatedItems = useMemo(() => items.map(calcularItem), [items]);
  const totales = useMemo(
    () => calcularTotalesDocumento(calculatedItems, aplica4x1000Global),
    [calculatedItems, aplica4x1000Global]
  );

  return (
    <div className="space-y-8">
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <svg className="w-6 h-6 text-[#24aceb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <h3 className="text-lg font-bold">Información del Cliente</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre del Cliente</span>
            <input 
               className="w-full rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:border-[#24aceb] focus:ring-1 focus:ring-[#24aceb] outline-none h-12 px-4 text-base transition-colors"
               placeholder="Ej: Juan Pérez" 
               value={clienteInfo.nombres}
               onChange={(e) => setClienteInfo({...clienteInfo, nombres: e.target.value})}
               type="text"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email de Contacto</span>
            <input 
               type="email" 
               className="w-full rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:border-[#24aceb] focus:ring-1 focus:ring-[#24aceb] outline-none h-12 px-4 text-base transition-colors"
               placeholder="cliente@empresa.com" 
               value={clienteInfo.email}
               onChange={(e) => setClienteInfo({...clienteInfo, email: e.target.value})}
            />
          </label>
          <label className="flex flex-col gap-2 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Notas Internas o Comentarios</span>
            <textarea 
               className="w-full rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:border-[#24aceb] focus:ring-1 focus:ring-[#24aceb] outline-none p-4 text-base resize-none transition-colors min-h-[100px]"
               placeholder="Detalles adicionales sobre los términos o condiciones..." 
               value={clienteInfo.notas}
               onChange={(e) => setClienteInfo({...clienteInfo, notas: e.target.value})}
            />
          </label>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-[#24aceb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            <h3 className="text-lg font-bold">Detalle de Ítems</h3>
          </div>
          <button
            onClick={agregarItem}
            className="flex items-center gap-2 text-[#24aceb] font-bold text-sm hover:bg-[#24aceb]/5 px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={18} />
            Añadir Ítem
          </button>
        </div>

        <div className="space-y-6">
          {calculatedItems.map((item, index) => (
            <div
              key={item.id}
              className="bg-gray-50/50 p-5 rounded-2xl border border-gray-200 flex flex-col gap-5 relative transition-all hover:shadow-md group"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => eliminarItem(item.id)}
                  className="text-red-400 hover:text-red-600 bg-white p-2 rounded-full shadow-sm border border-gray-100"
                  title="Eliminar ítem"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-purple-100 text-purple-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-gray-700">Configuración del Producto</h3>
              </div>

              {/* Fila Principal: Desc, Cant, Precio */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-6 space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción del Producto</Label>
                  <Input
                    className="h-10 bg-white"
                    value={item.descripcion}
                    onChange={(e) => updateItem(item.id, "descripcion", e.target.value)}
                    placeholder="Ej. Memoria RAM DDR5 32GB"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cantidad</Label>
                  <Input
                    className="h-10 bg-white"
                    type="number"
                    min="1"
                    value={item.cantidad || ""}
                    onChange={(e) => updateItem(item.id, "cantidad", Number(e.target.value))}
                  />
                </div>
                <div className="md:col-span-4 space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio Base (COP)</Label>
                  <Input
                    className="h-10 bg-white font-medium"
                    type="number"
                    min="0"
                    step="any"
                    value={item.precioUnitarioBase || ""}
                    onChange={(e) =>
                      updateItem(item.id, "precioUnitarioBase", Number(e.target.value))
                    }
                  />
                </div>
              </div>

              {/* Fila de Extra Cargos (Bloque Amazon like) */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mt-2">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`tax-${item.id}`}
                      checked={item.aplicaTax}
                      onCheckedChange={(c) => updateItem(item.id, "aplicaTax", !!c)}
                    />
                    <Label htmlFor={`tax-${item.id}`} className="text-sm font-semibold text-gray-700 cursor-pointer">
                      Cargo Adicional
                    </Label>
                  </div>
                  {item.aplicaTax && (
                    <Input
                      type="number"
                      className="h-9 text-sm"
                      placeholder="Valor extra ($)"
                      value={item.taxUnitario || ""}
                      onChange={(e) => updateItem(item.id, "taxUnitario", Number(e.target.value))}
                    />
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase">Envío Base</Label>
                  <Input
                    type="number"
                    className="h-9 text-sm"
                    placeholder="$ 0.00"
                    value={item.envioUnitario || ""}
                    onChange={(e) => updateItem(item.id, "envioUnitario", Number(e.target.value))}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-blue-600 uppercase">Promo Envío</Label>
                  <Input
                    type="number"
                    className="h-9 text-sm border-blue-200 focus-visible:ring-blue-400 bg-blue-50/30"
                    placeholder="-$ 0.00"
                    value={item.promocionEnvioUnitario || ""}
                    onChange={(e) => updateItem(item.id, "promocionEnvioUnitario", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase">Importación</Label>
                  <Input
                    type="number"
                    className="h-9 text-sm"
                    placeholder="$ 0.00"
                    value={item.importacionUnitario || ""}
                    onChange={(e) => updateItem(item.id, "importacionUnitario", Number(e.target.value))}
                  />
                </div>

                <div className="flex flex-col justify-center space-y-2 pl-4 border-l border-gray-100 md:ml-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`amz-${item.id}`}
                      checked={item.aplicaAmazon}
                      onCheckedChange={(c) => updateItem(item.id, "aplicaAmazon", !!c)}
                    />
                    <Label htmlFor={`amz-${item.id}`} className="text-sm font-semibold text-gray-800 cursor-pointer">
                      Garantía (2.25%)
                    </Label>
                  </div>
                  {item.aplicaAmazon && (
                    <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded inline-block w-fit">
                      +${item.amazonUnitarioCalculado.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>

              {/* Subtotal del Item */}
              <div className="flex flex-col md:flex-row justify-end items-end md:items-center gap-6 mt-2 pt-4 border-t border-gray-200">
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Costo Unit. Neto</p>
                  <p className="font-medium text-gray-600">${item.costoUnitarioFinal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right bg-purple-50 px-4 py-2 rounded-lg border border-purple-100">
                  <p className="text-xs text-purple-600 uppercase tracking-widest mb-1">Subtotal Línea</p>
                  <p className="text-xl font-black text-purple-900">${item.subtotalLinea.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl flex flex-col lg:flex-row justify-between gap-10 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="flex flex-col gap-6 max-w-sm relative z-10">
          <div>
            <h2 className="text-2xl font-bold mb-2">3. Consolidado Final</h2>
            <p className="text-slate-400 text-sm">Verifica los totales, aplica consideraciones tributarias globales y procesa el documento.</p>
          </div>
          
          <div className="flex items-start space-x-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700 backdrop-blur-sm">
            <Checkbox
              id="global-4x1000"
              checked={aplica4x1000Global}
              onCheckedChange={(c) => setAplica4x1000Global(!!c)}
              className="mt-1 border-slate-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            />
            <div>
              <Label htmlFor="global-4x1000" className="font-semibold text-white cursor-pointer text-base">
                Retención Bancaria (4x1000)
              </Label>
              <p className="text-xs text-slate-400 mt-1">
                Aplica la tasa gubernamental del 4x1000 sobre el subtotal base de este documento comercial.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-96 space-y-4 relative z-10 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-md">
          <div className="space-y-3 pb-4 border-b border-slate-700">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal Productos</span>
              <span className="font-medium">${totales.subtotal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
            </div>
            
            {totales.totalTax > 0 && (
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Cargos Adicionales (Tax)</span>
                <span>${totales.totalTax.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            
            {(totales.totalEnvio - totales.totalPromocionEnvio) !== 0 && (
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Total Envío (Neto Promociones)</span>
                <span>${(totales.totalEnvio - totales.totalPromocionEnvio).toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            
            {totales.totalImportacion > 0 && (
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Tasas de Importación Nacional</span>
                <span>${totales.totalImportacion.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            
            {totales.totalAmazon > 0 && (
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Servicio de Garantía (2.25%)</span>
                <span>${totales.totalAmazon.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            
            {aplica4x1000Global && (
              <div className="flex justify-between text-rose-300 text-sm font-medium">
                <span>Impuesto GMF (4x1000)</span>
                <span>+ ${totales.total4x1000.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-end text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent pt-2">
            <span>TOTAL:</span>
            <span>
              ${totales.totalFinal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="pt-6 space-y-3">
            <button 
              onClick={async () => {
                if (!clienteInfo.nombres) return alert("Ingresa el nombre del cliente.");
                setIsSaving(true);
                try {
                  const clienteDb = await createCustomer({ 
                    nombres: clienteInfo.nombres, 
                    email: clienteInfo.email, 
                    notas: clienteInfo.notas 
                  });
                  setClienteId(clienteDb.id);
                  const doc = await saveDocument({
                    tipo: tipoDocumento,
                    clienteId: clienteDb.id,
                    items: calculatedItems,
                    totales: totales,
                    observaciones: clienteInfo.notas
                  });
                  if(doc.success) {
                     alert(`${tipoDocumento === "COTIZACION" ? "Cotización" : "Factura"} guardada exitosamente: ` + doc.document.numero);
                  }
                } catch (e) {
                  alert("Error al guardar.");
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white p-3.5 rounded-xl font-bold transition disabled:opacity-50 shadow-lg shadow-blue-900/50"
            >
              {isSaving ? "Procesando Sistema..." : `Guardar en Base de Datos`}
            </button>
            <Dialog>
              <DialogTrigger className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white p-3.5 rounded-xl font-bold transition shadow-lg">
                <Printer size={20} />
                Generar Documento PDF
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl">Opciones de Impresión PDF</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-5 pt-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <Label className="font-semibold text-gray-700 min-w-max">Estructura del Documento:</Label>
                    <select 
                      className="border-gray-200 border p-3 rounded-xl bg-white text-sm w-full outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      value={formatoPDF}
                      onChange={(e) => setFormatoPDF(e.target.value as "completo" | "resumido" | "concatenado")}
                    >
                      <option value="completo">Completo (Tabla transparente con detalle de aduanas y envíos)</option>
                      <option value="resumido">Resumido (Tabla unificada mostrando Costo Unitario Neto)</option>
                      <option value="concatenado">Concatenado (Solo Texto formal, estilo Excel)</option>
                    </select>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
                    <ClientPDFViewer 
                      formato={formatoPDF} 
                      cliente={clienteInfo} 
                      items={calculatedItems} 
                      totales={totales} 
                      aplica4x1000Global={aplica4x1000Global} 
                      tipoDocumento={tipoDocumento}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
