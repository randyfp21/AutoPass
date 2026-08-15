import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Vehicle, ServiceRecord } from '../types';
import { formatRupiah, formatDate, formatMileage } from './formatters';

interface GenerateSpentPDFProps {
  records: Array<{ record: ServiceRecord; vehicle: Vehicle }>;
  monthTitle: string;
  vehicleFilterName: string;
  totalSpent: number;
  avgSpent: number;
  userName?: string;
}

export function generateSpentPDF({
  records,
  monthTitle,
  vehicleFilterName,
  totalSpent,
  avgSpent,
  userName = 'Pengguna Odomtr',
}: GenerateSpentPDFProps) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. Top Decorative Brand Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ODOMTR · DIGITAL VEHICLE PASSPORT', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Laporan Rekapitulasi Biaya Maintenance & Servis Kendaraan', margin, 21);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`REKAP ${monthTitle.toUpperCase()}`, pageWidth - margin, 17, { align: 'right' });

  // 2. Metadata Box
  let currentY = 36;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600

  // Left Column Metadata
  doc.setFont('helvetica', 'bold');
  doc.text('Nama Pemilik:', margin + 4, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(userName, margin + 30, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Filter Kendaraan:', margin + 4, currentY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(vehicleFilterName, margin + 30, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Periode Bulan:', margin + 4, currentY + 19);
  doc.setFont('helvetica', 'normal');
  doc.text(monthTitle, margin + 30, currentY + 19);

  // Right Column Summary Stats
  const rightColX = pageWidth - margin - 4;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text(`Total: ${formatRupiah(totalSpent)}`, rightColX, currentY + 9, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Transaksi: ${records.length} kali`, rightColX, currentY + 15, { align: 'right' });
  doc.text(`Rata-Rata / Servis: ${formatRupiah(avgSpent)}`, rightColX, currentY + 20, { align: 'right' });

  currentY += 30;

  // 3. Transactions Table
  const tableData = records.map(({ record, vehicle }, index) => {
    const workshopName = record.workshop_name_manual || (record.is_official_workshop ? 'Bengkel Resmi' : 'DIY Maintenance');
    const lineItems = (record.items && record.items.length > 0) ? record.items : (record.details || []);
    const itemsSummary = lineItems.length > 0
      ? lineItems.map((i) => `${i.item_name} (${i.quantity}x)`).join(', ')
      : 'Perawatan Rutin';

    return [
      String(index + 1),
      formatDate(record.service_date, 'short'),
      `${vehicle.brand} ${vehicle.model}\n[${vehicle.license_plate}]`,
      workshopName,
      `${formatMileage(record.mileage_at_service)} km`,
      itemsSummary,
      formatRupiah(record.total_cost),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Tanggal', 'Kendaraan & Plat', 'Bengkel', 'Odometer', 'Rincian Servis', 'Total Biaya']],
    body: tableData,
    foot: [['', '', '', '', '', 'TOTAL ACCUMULATED SPENT', formatRupiah(totalSpent)]],
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    footStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [251, 191, 36], // amber-400
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 34, fontStyle: 'bold' },
      3: { cellWidth: 32 },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 'auto' },
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // 4. Page Footer Stamp
  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text(
      `Odomtr Digital Vehicle Passport · Laporan Resmi Rekap Pengeluaran Servis`,
      margin,
      pageHeight - 7
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // 5. Save PDF file
  const sanitizeFilename = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Rekap_Spent_${sanitizeFilename(monthTitle)}_${sanitizeFilename(vehicleFilterName)}.pdf`;
  doc.save(filename);
}
