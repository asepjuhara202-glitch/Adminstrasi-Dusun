import React, { useState, useMemo } from 'react';
import { Warga, RW, MutasiLog, User } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  BarChart2, 
  PieChart as PieChartIcon, 
  Users, 
  Briefcase, 
  Droplet, 
  Home,
  Filter,
  ArrowLeftRight,
  Download,
  FileSpreadsheet,
  HeartCrack,
  UserCheck,
  UserMinus
} from 'lucide-react';

interface DashboardChartsProps {
  wargaList: Warga[];
  rwList: RW[];
  mutasiList: MutasiLog[];
  currentUser?: User | null;
}

export function DashboardCharts({ wargaList, rwList, mutasiList, currentUser }: DashboardChartsProps) {
  const isAdmin = currentUser?.role === 'Admin';
  const userRwId = currentUser?.rwId;

  const [selectedRw, setSelectedRw] = useState<string>(() => {
    return currentUser?.role === 'User' && currentUser?.rwId ? currentUser.rwId : 'all';
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('Aktif');

  // Keep selectedRw in sync if currentUser changes (e.g. logging in/out)
  React.useEffect(() => {
    if (currentUser?.role === 'User' && currentUser?.rwId) {
      setSelectedRw(currentUser.rwId);
    } else {
      setSelectedRw('all');
    }
  }, [currentUser]);

  // Filter warga based on selection
  const filteredWarga = useMemo(() => {
    return wargaList.filter(w => {
      const matchRw = selectedRw === 'all' || w.rwId === selectedRw;
      const matchStatus = selectedStatus === 'all' || w.status === selectedStatus;
      return matchRw && matchStatus;
    });
  }, [wargaList, selectedRw, selectedStatus]);

  // Filter mutasi logs based on RW selection
  const filteredMutasi = useMemo(() => {
    return mutasiList.filter(m => {
      if (selectedRw === 'all') return true;
      const citizen = wargaList.find(w => w.id === m.wargaId);
      return citizen?.rwId === selectedRw;
    });
  }, [mutasiList, wargaList, selectedRw]);

  // Compute LAMPID Statistics
  const lampidCounts = useMemo(() => {
    let lahir = 0;
    let meninggal = 0;
    let pindahKeluar = 0;
    let sementara = 0;
    let pindahMasuk = 0;

    filteredMutasi.forEach(m => {
      switch (m.jenis) {
        case 'Lahir':
          lahir++;
          break;
        case 'Meninggal':
          meninggal++;
          break;
        case 'Pindah Keluar':
          pindahKeluar++;
          break;
        case 'Penduduk Sementara':
          sementara++;
          break;
        case 'Pindah Masuk':
          pindahMasuk++;
          break;
        default:
          break;
      }
    });

    return { lahir, meninggal, pindahKeluar, sementara, pindahMasuk };
  }, [filteredMutasi]);

  // Handle Export Excel LAMPID Report
  const handleExportLampidExcel = () => {
    try {
      const summaryData = [
        { 'Kategori Mutasi (LAMPID)': 'Lahir (Kelahiran)', 'Kode': 'L', 'Jumlah Kejadian': lampidCounts.lahir, 'Keterangan': 'Pencatatan kelahiran baru di lingkungan' },
        { 'Kategori Mutasi (LAMPID)': 'Meninggal (Kematian)', 'Kode': 'M', 'Jumlah Kejadian': lampidCounts.meninggal, 'Keterangan': 'Pencatatan warga meninggal dunia' },
        { 'Kategori Mutasi (LAMPID)': 'Pindah Keluar', 'Kode': 'P', 'Jumlah Kejadian': lampidCounts.pindahKeluar, 'Keterangan': 'Warga pindah domisili ke luar dusun' },
        { 'Kategori Mutasi (LAMPID)': 'Penduduk Sementara', 'Kode': 'I', 'Jumlah Kejadian': lampidCounts.sementara, 'Keterangan': 'Pencatatan penduduk sementara / tinggal kontrak' },
        { 'Kategori Mutasi (LAMPID)': 'Pindah Masuk / Datang', 'Kode': 'D', 'Jumlah Kejadian': lampidCounts.pindahMasuk, 'Keterangan': 'Penduduk datang menetap baru' }
      ];

      const detailData = filteredMutasi.map((m, index) => ({
        'No': index + 1,
        'Nama Penduduk': m.namaWarga,
        'NIK': m.nik,
        'No. KK': m.kk,
        'Jenis Mutasi': m.jenis,
        'Kode LAMPID': m.jenis === 'Lahir' ? 'L' :
                       m.jenis === 'Meninggal' ? 'M' :
                       m.jenis === 'Pindah Keluar' ? 'P' :
                       m.jenis === 'Penduduk Sementara' ? 'I' : 'D',
        'Tanggal Peristiwa': m.tanggalPeristiwa,
        'Keterangan': m.keterangan || '',
        'Petugas Pelapor': m.petugasName,
        'Waktu Registrasi': m.timestamp
      }));

      const wb = XLSX.utils.book_new();

      // Create worksheets
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      const wsDetail = XLSX.utils.json_to_sheet(detailData);

      // Add to Workbook
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Statistik LAMPID');
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Catatan Mutasi');

      // Set column widths
      wsSummary['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 18 }, { wch: 45 }];
      wsDetail['!cols'] = [
        { wch: 6 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, 
        { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 40 }, 
        { wch: 20 }, { wch: 20 }
      ];

      const rwName = selectedRw === 'all' ? 'SEMUA_RW' : `RW_${selectedRw}`;
      XLSX.writeFile(wb, `LAPORAN_LAMPID_DUSUN III_${rwName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
      console.error('Gagal mengekspor data Excel LAMPID:', e);
      alert('Terjadi kesalahan saat mengekspor laporan kependudukan LAMPID!');
    }
  };

  // Handle Export PDF LAMPID Report
  const handleExportLampidPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Cover Header / Kop Surat style
      doc.setFillColor(30, 41, 59); // Charcoal Slate-600
      doc.rect(0, 0, 210, 8, 'F');

      // Title & Header Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text('PEMERINTAH DESA SUCI/DUSUN III', 15, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text('Kecamatan Karangpawitan, Kabupaten Garut • Telepon/WA: 0812-3456-7890', 15, 27);
      doc.text('Layanan Administrasi Kependudukan Terintegrasi (LAMPID)', 15, 32);

      // Divider Line
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setLineWidth(1);
      doc.line(15, 36, 195, 36);

      // Document Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(79, 70, 229); // Indigo-600
      doc.text('LAPORAN DINAMIKA KEPENDUDUKAN (LAMPID)', 15, 45);

      // Meta Info
      const dateStr = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const currentRwLabel = selectedRw === 'all' ? 'Semua Rukun Warga (RW)' : `Wilayah RW ${selectedRw}`;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.text(`Wilayah / RW : ${currentRwLabel}`, 15, 52);
      doc.text(`Tanggal Laporan : ${dateStr}`, 15, 57);
      doc.text(`Waktu Cetak     : ${new Date().toLocaleTimeString('id-ID')} WIB`, 15, 62);

      // Section 1: Ringkasan LAMPID
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('1. RINGKASAN STATISTIK LAMPID', 15, 71);

      const summaryRows = [
        ['L - Kelahiran (Lahir)', 'L', `${lampidCounts.lahir} Jiwa`, 'Pencatatan kelahiran baru di lingkungan'],
        ['M - Kematian (Meninggal)', 'M', `${lampidCounts.meninggal} Jiwa`, 'Pencatatan warga meninggal dunia'],
        ['P - Pindah Keluar', 'P', `${lampidCounts.pindahKeluar} Jiwa`, 'Warga pindah domisili ke luar dusun'],
        ['I - Penduduk Sementara', 'I', `${lampidCounts.sementara} Jiwa`, 'Pencatatan penduduk sementara (Tamu/Kontrak)'],
        ['D - Datang / Pindah Masuk', 'D', `${lampidCounts.pindahMasuk} Jiwa`, 'Penduduk datang menetap baru']
      ];

      autoTable(doc, {
        startY: 75,
        head: [['Kategori Mutasi', 'Kode', 'Jumlah Kejadian', 'Keterangan Layanan']],
        body: summaryRows,
        theme: 'striped',
        headStyles: {
          fillColor: [79, 70, 229], // Indigo 600
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [51, 65, 85]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Slate 50
        },
        margin: { left: 15, right: 15 }
      });

      // Section 2: Detail
      const nextY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('2. DAFTAR RIWAYAT CATATAN MUTASI (PENDUDUK)', 15, nextY);

      const detailHeaders = [['No', 'Nama Penduduk', 'NIK', 'Tipe Mutasi', 'Kd', 'Tanggal', 'Keterangan']];
      const detailRows = filteredMutasi.map((m, index) => {
        const kode = m.jenis === 'Lahir' ? 'L' :
                     m.jenis === 'Meninggal' ? 'M' :
                     m.jenis === 'Pindah Keluar' ? 'P' :
                     m.jenis === 'Penduduk Sementara' ? 'I' : 'D';
        return [
          String(index + 1),
          m.namaWarga,
          m.nik,
          m.jenis,
          kode,
          m.tanggalPeristiwa,
          m.keterangan || '-'
        ];
      });

      if (detailRows.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.text('Tidak ada daftar riwayat catatan mutasi terekam untuk filter wilayah saat ini.', 15, nextY + 6);
      } else {
        autoTable(doc, {
          startY: nextY + 4,
          head: detailHeaders,
          body: detailRows,
          theme: 'striped',
          headStyles: {
            fillColor: [100, 116, 139], // Slate 500
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 8.5,
            textColor: [51, 65, 85]
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 40 },
            2: { cellWidth: 32 },
            3: { cellWidth: 30 },
            4: { cellWidth: 10 },
            5: { cellWidth: 26 },
            6: { cellWidth: 32 }
          },
          margin: { left: 15, right: 15 }
        });
      }

      // Legal signature section at bottom
      const finalY = (doc as any).lastAutoTable?.finalY ? Math.max((doc as any).lastAutoTable.finalY + 15, 220) : 220;
      
      // Ensure space is on the page or add another page
      if (finalY > 260) {
        doc.addPage();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text('LEMBAR PENGESAHAN LAPORAN LAMPID', 15, 20);
        doc.line(15, 22, 195, 22);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`Cetak Laporan: ${dateStr}`, 15, 28);
        
        // signature
        doc.text('Mengetahui,', 140, 40);
        doc.text('Kepala Dusun Sukamaju', 140, 45);
        doc.text('( ______________________ )', 140, 75);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text('Mengetahui,', 140, finalY);
        doc.text('Kepala Dusun Sukamaju', 140, finalY + 5);
        doc.text('( ______________________ )', 140, finalY + 30);
      }

      // Add page numbers
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Halaman ${i} dari ${pageCount} • Kantor Dusun Sukamaju`, 15, 287);
        doc.text('Sistem Informasi Kependudukan Dusun (Sukamaju Smart-RT/RW)', 135, 287);
      }

      const rName = selectedRw === 'all' ? 'SEMUA_RW' : `RW_${selectedRw}`;
      doc.save(`LAPORAN_LAMPID_DUSUN III_${rName}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('Gagal mengekspor data PDF LAMPID:', e);
      alert('Terjadi kesalahan saat mengekspor laporan kependudukan LAMPID ke PDF!');
    }
  };

  // 1. RT Distribution Data
  const rtData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredWarga.forEach(w => {
      let rtStr = w.rt ? String(w.rt).trim() : '';
      if (!rtStr) {
        rtStr = 'N/A';
      } else {
        // format RT to "RT XX" for better label
        const numOnly = rtStr.replace(/\D/g, '');
        rtStr = numOnly ? `RT ${numOnly.padStart(2, '0')}` : 'N/A';
      }
      counts[rtStr] = (counts[rtStr] || 0) + 1;
    });

    // Sort RT names logically (RT 01, RT 02, etc. then N/A at the end)
    return Object.entries(counts)
      .map(([name, jumlah]) => ({ name, jumlah }))
      .sort((a, b) => {
        if (a.name === 'N/A') return 1;
        if (b.name === 'N/A') return -1;
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      });
  }, [filteredWarga]);

  // 2. Pekerjaan Distribution Data (Aggregate top 5, rest to "Lainnya")
  const pekerjaanData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredWarga.forEach(w => {
      const job = w.pekerjaan ? w.pekerjaan.trim() : 'Tidak/Belum Bekerja';
      counts[job] = (counts[job] || 0) + 1;
    });

    const entries = Object.entries(counts).map(([name, jumlah]) => ({ name, jumlah }));
    // Sort descending
    entries.sort((a, b) => b.jumlah - a.jumlah);

    if (entries.length <= 6) {
      return entries;
    }

    const topEntries = entries.slice(0, 5);
    const otherCount = entries.slice(5).reduce((sum, item) => sum + item.jumlah, 0);
    
    if (otherCount > 0) {
      topEntries.push({ name: 'Lainnya', jumlah: otherCount });
    }
    
    return topEntries;
  }, [filteredWarga]);

  // 3. Golongan Darah Distribution Data
  const golDarahData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredWarga.forEach(w => {
      let gol = w.golonganDarah ? w.golonganDarah.trim().toUpperCase() : '-';
      if (!gol || gol === '-' || gol === 'N/A') {
        gol = 'Tidak Tahu';
      }
      counts[gol] = (counts[gol] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        if (a.name === 'Tidak Tahu') return 1;
        if (b.name === 'Tidak Tahu') return -1;
        return a.name.localeCompare(b.name);
      });
  }, [filteredWarga]);

  // Premium color palettes matching Sukamaju theme
  const BAR_COLORS = {
    rt: '#4f46e5', // Indigo
    rtGradient: '#6366f1' // Light Indigo
  };

  const PIE_COLORS = [
    '#4f46e5', // Deep Indigo
    '#10b981', // Emerald Green
    '#f59e0b', // Amber Orange
    '#ec4899', // Rose Pink
    '#06b6d4', // Cyan Blue
    '#8b5cf6', // Violet Purple
    '#64748b'  // Slate Gray
  ];

  return (
    <div className="space-y-6">
      {/* Visual Filter Panel */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xxs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">Filter Demografi Penduduk</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Saring data grafik berdasarkan sektor kelolaan dan keaktifan warga</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
          {/* RW Filter */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial min-w-[120px]">
            <span className="text-xxs font-bold text-slate-400 uppercase">RW:</span>
            <select
              value={selectedRw}
              onChange={(e) => setSelectedRw(e.target.value)}
              disabled={!isAdmin}
              className="w-full sm:w-auto px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-150 rounded-lg font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isAdmin ? (
                <>
                  <option value="all">Semua RW</option>
                  {rwList.map(rw => (
                    <option key={rw.id} value={rw.id}>{rw.id} ({rw.wilayah})</option>
                  ))}
                </>
              ) : (
                <option value={userRwId}>{userRwId}</option>
              )}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial min-w-[120px]">
            <span className="text-xxs font-bold text-slate-400 uppercase">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-150 rounded-lg font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Sementara">Sementara</option>
              <option value="Pindah">Pindah Keluar</option>
              <option value="Meninggal">Wafat (Meninggal)</option>
            </select>
          </div>
        </div>
      </div>

      {/* LAMPID Dynamics Overview & Export */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
              Laporan Dinamika Kependudukan (LAMPID)
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Ringkasan mutasi dan data peristiwa penting kependudukan di wilayah terfilter</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleExportLampidExcel}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 py-2 px-3.5 bg-emerald-650 hover:bg-emerald-700 text-white text-[10px] font-black rounded-xl transition duration-150 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Eksport LAMPID (Excel)
            </button>
            <button
              onClick={handleExportLampidPdf}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 py-2 px-3.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-xl transition duration-150 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Eksport LAMPID (PDF)
            </button>
          </div>
        </div>

        {/* The 5 LAMPID Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {/* L - Lahir */}
          <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 flex flex-col justify-between">
            <span className="text-[10px] font-black text-emerald-850 uppercase tracking-wider mb-2 flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center font-black text-[9px] shrink-0 text-emerald-700">L</span>
              Kelahiran (Lahir)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-900">{lampidCounts.lahir}</span>
              <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider">Mutiara</span>
            </div>
          </div>

          {/* M - Meninggal */}
          <div className="p-3.5 rounded-xl border border-red-100/50 bg-rose-50/40 flex flex-col justify-between">
            <span className="text-[10px] font-black text-rose-850 uppercase tracking-wider mb-2 flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-rose-100 flex items-center justify-center font-black text-[9px] shrink-0 text-rose-700">M</span>
              Kematian (Mati)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-rose-900">{lampidCounts.meninggal}</span>
              <span className="text-[9px] font-extrabold text-rose-600 uppercase tracking-wider">Jiwa</span>
            </div>
          </div>

          {/* P - Pindah Keluar */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center font-black text-[9px] shrink-0 text-slate-600">P</span>
              Pindah Keluar
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-800">{lampidCounts.pindahKeluar}</span>
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Jiwa</span>
            </div>
          </div>

          {/* I - Penduduk Sementara */}
          <div className="p-3.5 rounded-xl border border-amber-100/65 bg-amber-50/30 flex flex-col justify-between">
            <span className="text-[10px] font-black text-amber-850 uppercase tracking-wider mb-2 flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center font-black text-[9px] shrink-0 text-amber-700">I</span>
              Sementara (Ikut)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-amber-900">{lampidCounts.sementara}</span>
              <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-wider">Jiwa</span>
            </div>
          </div>

          {/* D - Datang / Pindah Masuk */}
          <div className="p-3.5 rounded-xl border border-indigo-100/50 bg-indigo-50/30 flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[10px] font-black text-indigo-850 uppercase tracking-wider mb-2 flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center font-black text-[9px] shrink-0 text-indigo-700">D</span>
              Datang (Masuk)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-indigo-900">{lampidCounts.pindahMasuk}</span>
              <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider">Jiwa</span>
            </div>
          </div>
        </div>
      </div>

      {filteredWarga.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-100/80 text-center shadow-xxs">
          <p className="text-sm font-semibold text-slate-400">Tidak ada data penduduk yang cocok untuk visualisasi dengan filter terpilih.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: RT Distribution (Bar Chart) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs flex flex-col justify-between min-h-[340px]">
            <div>
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-indigo-600" />
                Sebaran per Rukun Tetangga (RT)
              </h3>
              <p className="text-[10px] text-slate-400 mb-4 font-semibold">Distribusi penduduk aktif di masing-masing RT</p>
            </div>
            
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={rtData}
                  margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderRadius: '8px', 
                      border: 'none', 
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="jumlah" fill={BAR_COLORS.rt} radius={[4, 4, 0, 0]} barSize={24} name="Total Warga">
                    {rtData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS.rt} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Pekerjaan (Horizontal Bar Chart or Vertical Bar Chart depending on length) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs flex flex-col justify-between min-h-[340px]">
            <div>
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                Mata Pencaharian Utama
              </h3>
              <p className="text-[10px] text-slate-400 mb-4 font-semibold">Klasifikasi 5 pekerjaan teratas beserta lainnya</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pekerjaanData}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis 
                    type="number"
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name" 
                    tick={{ fill: '#475569', fontSize: 9, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderRadius: '8px', 
                      border: 'none', 
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="jumlah" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} name="Total Warga" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Golongan Darah (Pie Chart with custom colored arcs) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs flex flex-col justify-between min-h-[340px]">
            <div>
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-rose-500" />
                Golongan Darah Penduduk
              </h3>
              <p className="text-[10px] text-slate-400 mb-4 font-semibold">Komposisi tipe golongan darah untuk kesiapan donor/medis</p>
            </div>

            <div className="h-44 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={golDarahData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {golDarahData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderRadius: '8px', 
                      border: 'none', 
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Inner absolute statistics count */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Total</span>
                <span className="text-xl font-extrabold text-slate-800 leading-none mt-0.5">{filteredWarga.length}</span>
              </div>
            </div>

            {/* Custom Pie Legend Grid */}
            <div className="grid grid-cols-4 gap-1 mt-2.5 pt-2.5 border-t border-slate-100/60">
              {golDarahData.map((entry, index) => {
                const pct = ((entry.value / filteredWarga.length) * 100).toFixed(0);
                return (
                  <div key={entry.name} className="flex flex-col items-center text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-700">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      {entry.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold ml-2.5">{entry.value} org ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
