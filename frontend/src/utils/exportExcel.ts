import * as XLSX from 'xlsx';

interface ExportColumn {
  key: string;
  header: string;
}

interface ExportData {
  [key: string]: any;
}

export function exportToExcel(
  data: ExportData[],
  columns: ExportColumn[],
  fileName: string,
  sheetName?: string
): void {
  if (data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  // Transform data to match columns
  const transformedData = data.map(row => {
    const newRow: { [key: string]: any } = {};
    columns.forEach(col => {
      let value = row[col.key];
      
      // Format dates
      if (value && typeof value === 'string' && value.includes('T')) {
        value = new Date(value).toLocaleDateString('es-CL');
      }
      
      // Format currency
      if (typeof value === 'number' && col.key.toLowerCase().includes('value') || 
          col.key.toLowerCase().includes('amount') ||
          col.key.toLowerCase().includes('cost') ||
          col.key.toLowerCase().includes('balance') ||
          col.key.toLowerCase().includes('income') ||
          col.key.toLowerCase().includes('payment')) {
        value = new Intl.NumberFormat('es-CL', { 
          style: 'currency', 
          currency: 'CLP',
          maximumFractionDigits: 0 
        }).format(value);
      }
      
      newRow[col.header] = value;
    });
    return newRow;
  });

  const ws = XLSX.utils.json_to_sheet(transformedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Datos');
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
