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

const ClientPDFViewer = dynamic(() => import("@/components/pdf/ClientPDFViewer"), {
  ssr: false,
});

export default function CotizacionForm() {
  const [clienteInfo, setClienteInfo] = useState({ nombres: "", email: "", notas: "" });
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
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-xl font-bold mb-4">Información del Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombres del Cliente</Label>
            <Input 
               placeholder="Ej. Juan Pérez" 
               value={clienteInfo.nombres}
               onChange={(e) => setClienteInfo({...clienteInfo, nombres: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input 
               type="email" 
               placeholder="cliente@correo.com" 
               value={clienteInfo.email}
               onChange={(e) => setClienteInfo({...clienteInfo, email: e.target.value})}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Notas</Label>
            <Textarea 
               placeholder="Observaciones adicionales" 
               value={clienteInfo.notas}
               onChange={(e) => setClienteInfo({...clienteInfo, notas: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Ítems (Motor de Cálculo)</h2>
          <button
            onClick={agregarItem}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={16} />
            Añadir Ítem
          </button>
        </div>

        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 text-sm font-semibold text-gray-600 bg-gray-50 p-3 rounded-lg mb-2">
            <div className="col-span-3">Descripción</div>
            <div className="col-span-1">Cant.</div>
            <div className="col-span-2">Precio Base ($)</div>
            <div className="col-span-2">Tax y Envío</div>
            <div className="col-span-1 text-center">Amazon</div>
            <div className="col-span-2 text-right">Subtotal ($)</div>
            <div className="col-span-1 text-center">Acción</div>
          </div>

          <div className="space-y-3">
            {calculatedItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 items-start border-b pb-3 last:border-0"
              >
                <div className="col-span-3">
                  <Input
                    value={item.descripcion}
                    onChange={(e) => updateItem(item.id, "descripcion", e.target.value)}
                    placeholder="Producto..."
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    type="number"
                    min="1"
                    value={item.cantidad || ""}
                    onChange={(e) => updateItem(item.id, "cantidad", Number(e.target.value))}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={item.precioUnitarioBase || ""}
                    onChange={(e) =>
                      updateItem(item.id, "precioUnitarioBase", Number(e.target.value))
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`tax-${item.id}`}
                      checked={item.aplicaTax}
                      onCheckedChange={(c) => updateItem(item.id, "aplicaTax", !!c)}
                    />
                    <Label htmlFor={`tax-${item.id}`} className="text-xs">
                      ¿Tax?
                    </Label>
                    {item.aplicaTax && (
                      <Input
                        type="number"
                        className="h-7 w-20 text-xs"
                        placeholder="Valor"
                        value={item.taxUnitario || ""}
                        onChange={(e) => updateItem(item.id, "taxUnitario", Number(e.target.value))}
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-xs">Envío:</Label>
                    <Input
                      type="number"
                      className="h-7 w-20 text-xs"
                      placeholder="$"
                      value={item.envioUnitario || ""}
                      onChange={(e) => updateItem(item.id, "envioUnitario", Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="col-span-1 flex flex-col items-center gap-1 justify-center pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`amz-${item.id}`}
                      checked={item.aplicaAmazon}
                      onCheckedChange={(c) => updateItem(item.id, "aplicaAmazon", !!c)}
                    />
                    <Label htmlFor={`amz-${item.id}`} className="text-xs">
                      2.25%
                    </Label>
                  </div>
                  {item.aplicaAmazon && (
                    <span className="text-[10px] text-gray-500">
                      +${item.amazonUnitarioCalculado.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="col-span-2 text-right pt-2 font-medium">
                  ${item.subtotalLinea.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  <div className="text-[10px] text-gray-400 font-normal mt-1">
                    C.U: ${item.costoUnitarioFinal.toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1 flex justify-center pt-2">
                  <button
                    onClick={() => eliminarItem(item.id)}
                    className="text-red-500 hover:text-red-700 transition"
                    title="Eliminar ítem"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between gap-6">
        <div className="flex flex-col gap-4 max-w-sm">
          <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <Checkbox
              id="global-4x1000"
              checked={aplica4x1000Global}
              onCheckedChange={(c) => setAplica4x1000Global(!!c)}
            />
            <Label htmlFor="global-4x1000" className="font-semibold text-blue-900 cursor-pointer">
              Aplicar 4x1000 Global al Documento
            </Label>
          </div>
          <p className="text-xs text-gray-500">
            El 4x1000 se calculará sobre el subtotal base de todos los artículos de la cotización.
          </p>
        </div>

        <div className="w-full md:w-80 space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal Items</span>
            <span>${totales.subtotal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-gray-600 text-sm">
            <span>Total Tax</span>
            <span>${totales.totalTax.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-gray-600 text-sm">
            <span>Total Envío</span>
            <span>${totales.totalEnvio.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-gray-600 text-sm">
            <span>Total Amazon (2.25%)</span>
            <span>${totales.totalAmazon.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
          </div>
          {aplica4x1000Global && (
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Impuesto 4x1000</span>
              <span>${totales.total4x1000.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <hr className="my-2" />
          <div className="flex justify-between text-xl font-bold bg-gray-50 p-2 rounded-lg">
            <span>TOTAL FINAL</span>
            <span className="text-blue-700">
              ${totales.totalFinal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="pt-6">
            <Dialog>
              <DialogTrigger className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-bold transition">
                <Printer size={20} />
                Generar Previsualización PDF
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Previsualización del Documento</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 bg-gray-50 p-4 border rounded-lg">
                    <Label className="font-semibold">Seleccionar Formato:</Label>
                    <select 
                      className="border p-2 rounded-md bg-white text-sm"
                      value={formatoPDF}
                      onChange={(e) => setFormatoPDF(e.target.value as "completo" | "resumido" | "concatenado")}
                    >
                      <option value="completo">Completo (Con precios transparentes y columnas)</option>
                      <option value="resumido">Resumido (Costo Unitario Final unificado)</option>
                      <option value="concatenado">Concatenado (Solo Texto, estilo Excel actual)</option>
                    </select>
                  </div>
                  <ClientPDFViewer 
                    formato={formatoPDF} 
                    cliente={clienteInfo} 
                    items={calculatedItems} 
                    totales={totales} 
                    aplica4x1000Global={aplica4x1000Global} 
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
