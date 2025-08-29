import { useState } from 'react';

interface ExportData {
  data: any[];
  filename: string;
  headers?: string[];
}

export const useAnalyticsExport = () => {
  const [exporting, setExporting] = useState(false);

  const exportToCsv = ({ data, filename, headers }: ExportData) => {
    setExporting(true);
    try {
      let csvContent = '';
      
      if (Array.isArray(data) && data.length > 0) {
        // If data is an array of objects, convert to CSV
        if (typeof data[0] === 'object') {
          const keys = headers || Object.keys(data[0]);
          csvContent = keys.join(',') + '\n';
          csvContent += data.map(row => 
            keys.map(key => {
              const value = row[key];
              // Handle commas and quotes in CSV
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            }).join(',')
          ).join('\n');
        } else {
          // If data is already a CSV string
          csvContent = data.join('\n');
        }
      } else if (typeof data[0] === 'string') {
        // If data is an array of strings (pre-formatted CSV)
        csvContent = data.join('\n');
      }

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const exportToPdf = ({ data, filename }: ExportData) => {
    setExporting(true);
    try {
      // Simple PDF export by opening print dialog
      // In a real implementation, you'd use a library like jsPDF
      const htmlContent = `
        <html>
          <head>
            <title>${filename}</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>${filename}</h1>
            <table>
              ${Array.isArray(data) && data.length > 0 ? `
                <thead>
                  <tr>
                    ${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${data.map(row => `
                    <tr>
                      ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              ` : ''}
            </table>
          </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return {
    exportToCsv,
    exportToPdf,
    exporting
  };
};