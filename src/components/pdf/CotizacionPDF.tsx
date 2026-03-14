import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ItemCalculated, DocumentTotals } from '@/lib/calculator';
import type { SellerData } from '@/app/actions/seller';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '1px solid #eee',
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  sellerBlock: {
    textAlign: 'right',
    maxWidth: 180,
  },
  sellerName: {
    fontWeight: 'bold',
    fontSize: 11,
    marginBottom: 2,
  },
  sellerMeta: {
    fontSize: 8,
    color: '#4a5568',
    marginBottom: 1,
  },
  clientInfo: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  clientText: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2d3748',
  },
  table: {
    flexDirection: 'column',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    paddingVertical: 6,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#edf2f7',
    fontWeight: 'bold',
    paddingVertical: 8,
  },
  colDesc: { flex: 4, paddingHorizontal: 4 },
  colCant: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 2, textAlign: 'right', paddingHorizontal: 4 },
  colTotal: { flex: 2, textAlign: 'right', paddingHorizontal: 4 },
  totalsBox: {
    alignSelf: 'flex-end',
    width: 250,
    borderTop: '2px solid #e2e8f0',
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalRowBold: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontWeight: 'bold',
    fontSize: 12,
  },
  notes: {
    marginTop: 30,
    fontSize: 9,
    color: '#718096',
    borderTop: '1px solid #eee',
    paddingTop: 10,
  },
  concatenatedRow: {
    flexDirection: 'row',
    marginBottom: 6,
    lineHeight: 1.4,
  },
  validity: {
    marginTop: 16,
    fontSize: 8,
    color: '#a0aec0',
    textAlign: 'right',
  },
});

interface PdfProps {
  formato: 'completo' | 'resumido' | 'concatenado';
  cliente: {
    nombres: string;
    email: string;
    notas: string;
  };
  items: ItemCalculated[];
  totales: DocumentTotals;
  tipoDocumento: 'COTIZACION' | 'FACTURA';
  seller?: SellerData | null;
}

const fmt = (val: number) => `$${val.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;

export const CotizacionPDF = ({
  formato,
  cliente,
  items,
  totales,
  tipoDocumento,
  seller,
}: PdfProps) => {
  const docTitle =
    tipoDocumento === 'COTIZACION'
      ? 'COTIZACIÓN COMERCIAL'
      : 'DOCUMENTO EQUIVALENTE / FACTURA';

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{docTitle}</Text>
            <Text style={{ marginTop: 4, color: '#4a5568' }}>
              Fecha: {new Date().toLocaleDateString('es-CO')}
            </Text>
          </View>
          <View style={styles.sellerBlock}>
            <Text style={styles.sellerName}>
              {seller?.nombre ?? 'Vendedor'}
            </Text>
            {seller?.profesion ? (
              <Text style={styles.sellerMeta}>{seller.profesion}</Text>
            ) : null}
            {seller?.identificacion ? (
              <Text style={styles.sellerMeta}>NIT/CC: {seller.identificacion}</Text>
            ) : null}
            {seller?.celular ? (
              <Text style={styles.sellerMeta}>Tel: {seller.celular}</Text>
            ) : null}
            {seller?.email ? (
              <Text style={styles.sellerMeta}>{seller.email}</Text>
            ) : null}
            {seller?.direccion ? (
              <Text style={styles.sellerMeta}>{seller.direccion}</Text>
            ) : null}
          </View>
        </View>

        {/* Client info */}
        <View style={styles.clientInfo}>
          <Text style={styles.sectionTitle}>Datos del Cliente</Text>
          <Text style={styles.clientText}>
            Nombre: {cliente.nombres || '_______________________'}
          </Text>
          <Text style={styles.clientText}>
            Email: {cliente.email || '_______________________'}
          </Text>
        </View>

        {/* Items table — Completo */}
        {formato === 'completo' && (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.colDesc}>Descripción</Text>
              <Text style={styles.colCant}>Cant.</Text>
              <Text style={styles.colPrice}>P. Unit Base</Text>
              <Text style={styles.colPrice}>Tax/Env/Imp/Gar</Text>
              <Text style={styles.colTotal}>Subtotal</Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colDesc}>{item.descripcion}</Text>
                <Text style={styles.colCant}>{item.cantidad}</Text>
                <Text style={styles.colPrice}>{fmt(item.precioUnitarioBase)}</Text>
                <View style={styles.colPrice}>
                  {item.aplicaTax && (
                    <Text style={{ fontSize: 8 }}>Tax: {fmt(item.taxUnitario)}</Text>
                  )}
                  {(item.envioUnitario > 0 || item.promocionEnvioUnitario > 0) && (
                    <Text style={{ fontSize: 8 }}>
                      Env: {fmt(item.envioUnitario - item.promocionEnvioUnitario)}
                    </Text>
                  )}
                  {item.importacionUnitario > 0 && (
                    <Text style={{ fontSize: 8 }}>Imp: {fmt(item.importacionUnitario)}</Text>
                  )}
                  {item.aplicaAmazon && (
                    <Text style={{ fontSize: 8 }}>Gar: 2.25%</Text>
                  )}
                </View>
                <Text style={styles.colTotal}>{fmt(item.subtotalLinea)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Items table — Resumido */}
        {formato === 'resumido' && (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.colDesc}>Descripción</Text>
              <Text style={styles.colCant}>Cant.</Text>
              <Text style={styles.colPrice}>Cos. Unit. Final</Text>
              <Text style={styles.colTotal}>Subtotal</Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colDesc}>{item.descripcion}</Text>
                <Text style={styles.colCant}>{item.cantidad}</Text>
                <Text style={styles.colPrice}>{fmt(item.costoUnitarioFinal)}</Text>
                <Text style={styles.colTotal}>{fmt(item.subtotalLinea)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Items — Concatenado: solo descripción y cantidad, sin precios */}
        {formato === 'concatenado' && (
          <View style={{ marginBottom: 20 }}>
            {items.map((item, i) => (
              <View key={i} style={styles.concatenatedRow}>
                <Text>
                  • {item.cantidad} UND x {item.descripcion}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={styles.totalsBox}>
          {formato === 'completo' && (
            <>
              <View style={styles.totalRow}>
                <Text>Subtotal Ítems:</Text>
                <Text>{fmt(totales.subtotal)}</Text>
              </View>
              {totales.totalTax > 0 && (
                <View style={styles.totalRow}>
                  <Text>Total Tax:</Text>
                  <Text>{fmt(totales.totalTax)}</Text>
                </View>
              )}
              {totales.totalEnvio > 0 && (
                <View style={styles.totalRow}>
                  <Text>Descuento Envío:</Text>
                  <Text>{fmt(totales.totalEnvio)}</Text>
                </View>
              )}
              {totales.totalPromocionEnvio > 0 && (
                <View style={styles.totalRow}>
                  <Text>Promo Envío Gratis:</Text>
                  <Text>-{fmt(totales.totalPromocionEnvio)}</Text>
                </View>
              )}
              {totales.totalImportacion > 0 && (
                <View style={styles.totalRow}>
                  <Text>Total Importación:</Text>
                  <Text>{fmt(totales.totalImportacion)}</Text>
                </View>
              )}
              {totales.totalAmazon > 0 && (
                <View style={styles.totalRow}>
                  <Text>Garantía Tasa de Cambio:</Text>
                  <Text>{fmt(totales.totalAmazon)}</Text>
                </View>
              )}
            </>
          )}
          <View style={styles.totalRowBold}>
            <Text>TOTAL A PAGAR:</Text>
            <Text>{fmt(totales.totalFinal)}</Text>
          </View>
        </View>

        {cliente.notas && (
          <View style={styles.notes}>
            <Text style={{ fontWeight: 'bold' }}>Notas y Observaciones:</Text>
            <Text>{cliente.notas}</Text>
          </View>
        )}

        <Text style={styles.validity}>
          Válida por 15 días calendario a partir de la fecha de emisión.
        </Text>

      </Page>
    </Document>
  );
};
