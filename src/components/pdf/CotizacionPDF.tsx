import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ItemCalculated, DocumentTotals } from '@/lib/calculator';

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
  }
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
  aplica4x1000Global: boolean;
}

const formatCurrency = (val: number) => `$${val.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;

export const CotizacionPDF = ({ formato, cliente, items, totales, aplica4x1000Global }: PdfProps) => {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>COTIZACIÓN COMERCIAL</Text>
            <Text style={{ marginTop: 4, color: '#4a5568' }}>Fecha: {new Date().toLocaleDateString('es-CO')}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ fontWeight: 'bold' }}>FERNANDO RHENALS</Text>
            <Text>ferchotecnico.com</Text>
          </View>
        </View>

        <View style={styles.clientInfo}>
          <Text style={styles.sectionTitle}>Datos del Cliente</Text>
          <Text style={styles.clientText}>Nombre: {cliente.nombres || '_______________________'}</Text>
          <Text style={styles.clientText}>Email: {cliente.email || '_______________________'}</Text>
        </View>

        {formato === 'completo' && (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.colDesc}>Descripción</Text>
              <Text style={styles.colCant}>Cant.</Text>
              <Text style={styles.colPrice}>P. Unit Base</Text>
              <Text style={styles.colPrice}>Tax/Envío/Amz</Text>
              <Text style={styles.colTotal}>Subtotal</Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colDesc}>{item.descripcion}</Text>
                <Text style={styles.colCant}>{item.cantidad}</Text>
                <Text style={styles.colPrice}>{formatCurrency(item.precioUnitarioBase)}</Text>
                <View style={styles.colPrice}>
                   {item.aplicaTax && <Text style={{ fontSize: 8 }}>Tax: {formatCurrency(item.taxUnitario)}</Text>}
                   {(item.envioUnitario > 0) && <Text style={{ fontSize: 8 }}>Envío: {formatCurrency(item.envioUnitario)}</Text>}
                   {item.aplicaAmazon && <Text style={{ fontSize: 8 }}>Amz: 2.25%</Text>}
                </View>
                <Text style={styles.colTotal}>{formatCurrency(item.subtotalLinea)}</Text>
              </View>
            ))}
          </View>
        )}

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
                <Text style={styles.colPrice}>{formatCurrency(item.costoUnitarioFinal)}</Text>
                <Text style={styles.colTotal}>{formatCurrency(item.subtotalLinea)}</Text>
              </View>
            ))}
          </View>
        )}

        {formato === 'concatenado' && (
          <View style={{ marginBottom: 20 }}>
            {items.map((item, i) => (
              <View key={i} style={styles.concatenatedRow}>
                <Text>
                  • {item.cantidad} UND x {item.descripcion} - {formatCurrency(item.costoUnitarioFinal)} c/u = {formatCurrency(item.subtotalLinea)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.totalsBox}>
          {formato === 'completo' && (
            <>
              <View style={styles.totalRow}>
                <Text>Subtotal Ítems:</Text>
                <Text>{formatCurrency(totales.subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text>Total Tax:</Text>
                <Text>{formatCurrency(totales.totalTax)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text>Total Envío:</Text>
                <Text>{formatCurrency(totales.totalEnvio)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text>Total Amazon:</Text>
                <Text>{formatCurrency(totales.totalAmazon)}</Text>
              </View>
            </>
          )}
          {aplica4x1000Global && (
             <View style={styles.totalRow}>
               <Text>4x1000:</Text>
               <Text>{formatCurrency(totales.total4x1000)}</Text>
             </View>
          )}
          <View style={styles.totalRowBold}>
            <Text>TOTAL A PAGAR:</Text>
            <Text>{formatCurrency(totales.totalFinal)}</Text>
          </View>
        </View>

        {cliente.notas && (
          <View style={styles.notes}>
            <Text style={{ fontWeight: 'bold' }}>Notas y Observaciones:</Text>
            <Text>{cliente.notas}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};
