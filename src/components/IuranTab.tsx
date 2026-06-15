import React, { useState } from 'react';
import { Iuran, Warga, TransaksiIuran, User } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Plus, Search, DollarSign, Wallet, FileSpreadsheet, ArrowUpRight } from 'lucide-react';

interface IuranTabProps {
  currentUser: User | null;
  wargaList: Warga[];
  iuranList: Iuran[];
  transaksiList: TransaksiIuran[];
  onAddIuranRecord: (iuran: Omit<Iuran, 'id'>) => Promise<void>;
  onPayIuran: (id: number, amount: number, keterangan: string) => Promise<void>;
  onAddTransaksi: (trans: Omit<TransaksiIuran, 'id'>) => Promise<void>;
}

export function IuranTab({
  currentUser,
  wargaList,
  iuranList,
  transaksiList,
  onAddIuranRecord,
  onPayIuran,
  onAddTransaksi
}: IuranTabProps) {
  // Filtered dues rows
  const citizenMap = new Map(wargaList.map(w => [w.id, w]));
  const isAdmin = currentUser?.role === 'Admin';
  const userRwId = currentUser?.rwId;

  const [search, setSearch] = useState('');
  const [filterMonth, setFilterStatusMonth] = useState('Juni 2026');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Modal states
  const [showPayModal, setShowPayModal] = useState<Iuran | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  
  // Payment helper states
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDesc, setPayKeterangan] = useState('');

  // Generate target month helper state
  const [newMonth, setNewMonth] = useState('Juli 2026');
  const [newAmount, setNewAmount] = useState(25000);

  // Expense Form Modal states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseWargaId, setExpenseWargaId] = useState<number>(() => {
    const eligibleWarga = wargaList.filter(w => isAdmin || w.rwId === currentUser?.rwId);
    return eligibleWarga[0]?.id || (wargaList[0]?.id || 1);
  });
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Month date mapper for transaction lists (e.g. "2026-06-02" -> "Juni 2026")
  const getTransactionMonthYear = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 2) return '';
    const year = parts[0];
    const monthNum = parts[1];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const idx = parseInt(monthNum, 10) - 1;
    if (idx >= 0 && idx < 12) {
      return `${months[idx]} ${year}`;
    }
    return '';
  };

  // Statistics calculation scoped to user RW if not Admin
  const currentMonthIurans = iuranList.filter(i => {
    if (i.bulanTahun !== filterMonth) return false;
    const citizen = citizenMap.get(i.wargaId);
    if (!citizen) return false;
    return isAdmin || citizen.rwId === userRwId;
  });

  // Financial calculations
  const uangMasukBulanan = transaksiList.filter(t => {
    if (t.jenis !== 'Masuk') return false;
    const citizen = citizenMap.get(t.wargaId);
    if (!citizen) return false;
    const isEligible = isAdmin || citizen.rwId === userRwId;
    return isEligible && getTransactionMonthYear(t.tanggal) === filterMonth;
  }).reduce((sum, t) => sum + t.jumlah, 0);

  const totalUangMasuk = transaksiList.filter(t => {
    if (t.jenis !== 'Masuk') return false;
    const citizen = citizenMap.get(t.wargaId);
    return citizen && (isAdmin || citizen.rwId === userRwId);
  }).reduce((sum, t) => sum + t.jumlah, 0);

  const uangKeluarBulanan = transaksiList.filter(t => {
    if (t.jenis !== 'Keluar') return false;
    const citizen = citizenMap.get(t.wargaId);
    if (!citizen) return false;
    const isEligible = isAdmin || citizen.rwId === userRwId;
    return isEligible && getTransactionMonthYear(t.tanggal) === filterMonth;
  }).reduce((sum, t) => sum + t.jumlah, 0);

  const totalUangKeluar = transaksiList.filter(t => {
    if (t.jenis !== 'Keluar') return false;
    const citizen = citizenMap.get(t.wargaId);
    return citizen && (isAdmin || citizen.rwId === userRwId);
  }).reduce((sum, t) => sum + t.jumlah, 0);

  const saldoKeuangan = totalUangMasuk - totalUangKeluar;

  const totalExpected = currentMonthIurans.reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalCollectedForMonth = currentMonthIurans.reduce((acc, curr) => acc + curr.totalDibayar, 0);
  const totalOutstanding = totalExpected - totalCollectedForMonth;

  const filteredIurans = currentMonthIurans.filter(i => {
    const citizen = citizenMap.get(i.wargaId);
    if (!citizen) return false;

    const matchesSearch = citizen.nama.toLowerCase().includes(search.toLowerCase()) || 
                          citizen.nik.includes(search);
    const matchesStatus = filterStatus === 'ALL' || i.statusBayar === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const currentMonthExpenses = transaksiList.filter(t => {
    if (t.jenis !== 'Keluar') return false;
    const citizen = citizenMap.get(t.wargaId);
    if (!citizen) return false;
    const isEligible = isAdmin || citizen.rwId === userRwId;

    const matchesSearch = citizen.nama.toLowerCase().includes(search.toLowerCase()) || 
                          t.keterangan.toLowerCase().includes(search.toLowerCase());

    return isEligible && getTransactionMonthYear(t.tanggal) === filterMonth && matchesSearch;
  });

  // Export to Excel using real XLSX library
  const handleExportExcel = () => {
    try {
      const dataToExport = iuranList
        .filter(i => {
          const citizen = citizenMap.get(i.wargaId);
          return citizen && (isAdmin || citizen.rwId === userRwId);
        })
        .map(i => {
          const citizen = citizenMap.get(i.wargaId);
          return {
            'Nama Penduduk': citizen?.nama || 'Tidak Terdata',
            'NIK': citizen?.nik || '-',
            'RW Wilayah': citizen?.rwId || '-',
            'Bulan & Tahun': i.bulanTahun,
            'Besar Tagihan (Rp)': i.jumlah,
            'Jumlah Dibayar (Rp)': i.totalDibayar,
            'Status Pembayaran': i.statusBayar
          };
        });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(wb, ws, 'Data Iuran Dusun');
      XLSX.writeFile(wb, `REKAP_IURAN_DUSUN_SUKAMAJU_${filterMonth.replace(' ', '_')}.xlsx`);
    } catch (e) {
      console.error('Gagal mengekspor file Excel:', e);
      alert('Terjadi kesalahan saat mengekspor laporan iuran!');
    }
  };

  // Export report to PDF with Kop Pemerintahan Desa and complete table
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // 1. Kop Surat Pemerintahan Desa (Times New Roman-style layout for official look)
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.text('PEMERINTAH KABUPATEN CIREBON', 105, 14, { align: 'center' });
      doc.setFontSize(11);
      doc.text('KECAMATAN SUKAMAJU', 105, 20, { align: 'center' });
      doc.setFontSize(15);
      doc.text('KANTOR KEPALA DUSUN BLOK C', 105, 26, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('times', 'normal');
      doc.text('Alamat: Jl. Raya Sukamaju No. 45 Wilayah Dusun, Kode Pos 45184', 105, 31, { align: 'center' });

      // Double styling line separation under header
      doc.setLineWidth(0.8);
      doc.line(15, 34, 195, 34);
      doc.setLineWidth(0.2);
      doc.line(15, 35.2, 195, 35.2);

      // Document Title
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.text('LAPORAN PERTANGGUNGJAWABAN KEUANGAN & IURAN WARGA', 105, 43, { align: 'center' });
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text(`Periode Laporan: ${filterMonth}`, 15, 52);
      doc.text(`Wilayah Pengawasan: ${isAdmin ? 'Semua RW Dusun' : userRwId}`, 15, 57);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 195, 52, { align: 'right' });

      // Summary Metric stats display box
      doc.setFillColor(248, 250, 252); // bg-slate-50
      doc.rect(15, 62, 180, 25, 'F');
      doc.setDrawColor(226, 232, 240); // src-slate-100/200
      doc.rect(15, 62, 180, 25, 'S');

      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.text('RINGKASAN REKAPITULASI KEUANGAN:', 20, 67.5);
      
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.text(`Uang Masuk Bulanan: Rp ${uangMasukBulanan.toLocaleString('id-ID')}`, 20, 74);
      doc.text(`Total Penyetoran Masuk: Rp ${totalUangMasuk.toLocaleString('id-ID')}`, 20, 80);
      
      doc.text(`Uang Keluar Bulanan: Rp ${uangKeluarBulanan.toLocaleString('id-ID')}`, 110, 74);
      doc.text(`Total Pengeluaran Keluar: Rp ${totalUangKeluar.toLocaleString('id-ID')}`, 110, 80);
      
      doc.setFont('times', 'bold');
      doc.setTextColor(79, 70, 229); // Indigo for balance highlight
      doc.text(`SISA SALDO BERSIH KAS: Rp ${saldoKeuangan.toLocaleString('id-ID')}`, 20, 85);
      doc.setTextColor(0, 0, 0); // reset black

      // Preparing table rows matching filter (without NIK)
      const tableRows = iuranList
        .filter(i => {
          const citizen = citizenMap.get(i.wargaId);
          return citizen && (isAdmin || citizen.rwId === userRwId);
        })
        .map((i, index) => {
          const citizen = citizenMap.get(i.wargaId);
          return [
            String(index + 1),
            citizen?.nama || 'Tidak Terdata',
            citizen?.rwId || '-',
            `Rp ${i.jumlah.toLocaleString('id-ID')}`,
            `Rp ${i.totalDibayar.toLocaleString('id-ID')}`,
            i.statusBayar
          ];
        });

      // Render table using jspdf-autotable direct function
      autoTable(doc, {
        head: [['No', 'Nama Penduduk', 'Wilayah', 'Tagihan', 'Dibayar', 'Status']],
        body: tableRows,
        startY: 92,
        theme: 'grid',
        headStyles: {
          fillColor: [51, 65, 85], // slate-700
          textColor: [255, 255, 255],
          font: 'times',
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center'
        },
        bodyStyles: {
          font: 'times',
          fontSize: 8.5
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { fontStyle: 'bold' },
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'center' }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Slate-50 alternative row
        }
      });

      // Preparing second table dataset for expense/exits
      const expenseRows = transaksiList
        .filter(t => {
          if (t.jenis !== 'Keluar') return false;
          const citizen = citizenMap.get(t.wargaId);
          return citizen && (isAdmin || citizen.rwId === userRwId);
        })
        .map((t, index) => {
          const citizen = citizenMap.get(t.wargaId);
          return [
            String(index + 1),
            t.tanggal || '-',
            citizen?.nama || 'Petugas / PJ',
            t.keterangan || '-',
            `Rp ${t.jumlah.toLocaleString('id-ID')}`
          ];
        });

      const firstTableFinalY = (doc as any).lastAutoTable.finalY || 130;
      let secondHeadingY = firstTableFinalY + 12;
      
      if (secondHeadingY > 250) {
        doc.addPage();
        secondHeadingY = 25;
      }
      
      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.text('DETAIL TARGET REALISASI PENGELUARAN KAS DUSUN:', 15, secondHeadingY);
      
      autoTable(doc, {
        head: [['No', 'Tanggal', 'Penanggung Jawab / PJ', 'Keterangan Pengeluaran', 'Jumlah']],
        body: expenseRows,
        startY: secondHeadingY + 4,
        theme: 'grid',
        headStyles: {
          fillColor: [190, 24, 74], // Rose-800 for expense accent
          textColor: [255, 255, 255],
          font: 'times',
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center'
        },
        bodyStyles: {
          font: 'times',
          fontSize: 8.5
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 40 },
          4: { cellWidth: 30, halign: 'right' }
        },
        alternateRowStyles: {
          fillColor: [254, 242, 242] // Rose-50 alternative row
        }
      });

      // Render signature certification block
      const finalY = (doc as any).lastAutoTable.finalY || 130;
      let sigY = finalY + 15;
      if (sigY > 255) {
        doc.addPage();
        sigY = 30;
      }

      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text('Mengetahui dan Mengesahkan,', 135, sigY);
      doc.setFont('times', 'bold');
      doc.text(isAdmin ? 'Kepala Pemerataan Dusun' : `Ketua Wilayah ${userRwId || 'RW'}`, 135, sigY + 6);
      
      doc.line(135, sigY + 28, 190, sigY + 28); // line
      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.text(isAdmin ? 'Ibu Kades Rahma' : currentUser?.nama || 'Ketua RW Petugas', 135, sigY + 32);
      doc.setFont('times', 'normal');
      doc.text('Pemberdayaan Dusun Sukamaju', 135, sigY + 36);

      // download document
      doc.save(`LAPORAN_RESMI_KAS_DUSUN_${filterMonth.replace(' ', '_')}.pdf`);
    } catch (error) {
      console.error('Pdf generation error:', error);
      alert('Terjadi error saat mengubah dokumen ke PDF.');
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0) {
      alert('Jumlah dana keluar harus bernilai besar dari 0!');
      return;
    }
    if (!expenseDesc.trim()) {
      alert('Deskripsi pengeluaran kas wajib diinput!');
      return;
    }

    await onAddTransaksi({
      iuranId: 0,
      wargaId: expenseWargaId,
      tanggal: expenseDate,
      jenis: 'Keluar',
      jumlah: expenseAmount,
      keterangan: expenseDesc
    });

    setExpenseAmount(0);
    setExpenseDesc('');
    setShowExpenseModal(false);
    alert('Sukses mencatat transaksi pengeluaran keuangan dusun!');
  };

  const handleApplyDuesToAll = async () => {
    const activeWarga = wargaList.filter(w => w.status === 'Aktif' && (isAdmin || w.rwId === userRwId));
    if (activeWarga.length === 0) {
      alert('Tidak ada warga berstatus Aktif untuk ditagih!');
      return;
    }

    // Check if matching months exist to prevent duplicates
    const checkExisten = iuranList.some(i => i.bulanTahun === newMonth && (
      isAdmin || citizenMap.get(i.wargaId)?.rwId === userRwId
    ));
    if (checkExisten) {
      if (!confirm(`Tagihan untuk bulan ${newMonth} sudah ada. Teruskan menambah baris tagihan baru?`)) {
        return;
      }
    }

    for (const w of activeWarga) {
      await onAddIuranRecord({
        wargaId: w.id,
        bulanTahun: newMonth,
        jumlah: newAmount,
        totalDibayar: 0,
        statusBayar: 'Belum Bayar'
      });
    }

    setFilterStatusMonth(newMonth);
    setShowGenerateModal(false);
    alert(`Sukses merilis tagihan keuangan sebesar Rp ${newAmount.toLocaleString('id-ID')} untuk ${activeWarga.length} warga aktif.`);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal) return;

    if (payAmount <= 0) {
      alert('Jumlah pembayaran harus bernilai positif!');
      return;
    }

    await onPayIuran(showPayModal.id, payAmount, payDesc);
    setShowPayModal(null);
    setPayAmount(0);
    setPayKeterangan('');
  };

  return (
    <div className="space-y-6">
      {/* Finance Stats Panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card Saldo Kas */}
        <div id="stats-saldo-kas" className="bg-indigo-600 p-5 rounded-2xl text-white flex flex-col justify-between col-span-1 md:col-span-2 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Saldo Bersih Kas Dusun</span>
            <Wallet className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <span className="text-3xl font-extrabold font-mono">Rp {saldoKeuangan.toLocaleString('id-ID')}</span>
            <p className="text-xs text-indigo-200 mt-2 font-medium">Sisa saldo akumulatif (Dana Masuk - Keluar)</p>
          </div>
        </div>

        {/* Card Uang Masuk */}
        <div id="stats-uang-masuk" className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-xxs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Dana Masuk</span>
            <p className="text-lg font-extrabold text-emerald-650 font-mono">Rp {totalUangMasuk.toLocaleString('id-ID')}</p>
            <p className="text-[10px] text-slate-450 mt-0.5">Akumulasi Seluruh Metode</p>
          </div>
          <div className="border-t border-slate-100 pt-2.5 mt-2">
            <span className="text-[10px] font-bold text-slate-450">Bulan Ini ({filterMonth})</span>
            <p className="text-sm font-bold text-emerald-700 font-mono mt-0.5">Rp {uangMasukBulanan.toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* Card Uang Keluar */}
        <div id="stats-uang-keluar" className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-xxs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Dana Keluar</span>
            <p className="text-lg font-extrabold text-rose-650 font-mono">Rp {totalUangKeluar.toLocaleString('id-ID')}</p>
            <p className="text-[10px] text-slate-450 mt-0.5">Akumulasi Biaya/Mutasi</p>
          </div>
          <div className="border-t border-slate-100 pt-2.5 mt-2">
            <span className="text-[10px] font-bold text-slate-450">Bulan Ini ({filterMonth})</span>
            <p className="text-sm font-bold text-rose-700 font-mono mt-0.5">Rp {uangKeluarBulanan.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* Controller Area */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari warga..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 text-xs w-full sm:w-48 font-medium"
            />
          </div>

          {/* Month selector filter */}
          <select
            value={filterMonth}
            onChange={(e) => setFilterStatusMonth(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="Mei 2026">Mei 2026</option>
            <option value="Juni 2026">Juni 2026</option>
            <option value="Juli 2026">Juli 2026</option>
          </select>

          {/* Status selector filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Pembayaran</option>
            <option value="Lunas">Lunas</option>
            <option value="Kurang">Kurang</option>
            <option value="Belum Bayar">Belum Bayar</option>
          </select>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
          {/* Admin / Ketua RW Rilis iuran */}
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex-grow sm:flex-grow-0 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Rilis Tagihan
          </button>

          {/* Catat Pengeluaran */}
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex-grow sm:flex-grow-0 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 bg-red-50 hover:bg-red-150 text-red-700 text-xs font-bold rounded-xl transition cursor-pointer border border-red-100/50"
          >
            <Plus className="w-3.5 h-3.5" />
            Catat Pengeluaran
          </button>
          
          {/* PDF Laporan Resmi */}
          <button
            onClick={handleExportPDF}
            className="flex-grow sm:flex-grow-0 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 text-xs font-extrabold rounded-xl transition cursor-pointer border border-indigo-100"
          >
            <Download className="w-3.5 h-3.5" />
            Cetak PDF Laporan
          </button>
        </div>
      </div>

      {/* Monthly Dues Table Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Nama Penduduk</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Wilayah RW</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Periode</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Besar Tagihan</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Telah Dibayar</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredIurans.length > 0 ? (
                filteredIurans.map((iuran) => {
                  const citizen = citizenMap.get(iuran.wargaId);
                  if (!citizen) return null;
                  return (
                    <tr key={iuran.id} className="hover:bg-slate-50/30 transition">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-bold text-slate-900">{citizen.nama}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">{citizen.rwId}</td>
                      <td className="py-3 px-4 font-medium text-slate-500">{iuran.bulanTahun}</td>
                      <td className="py-3 px-4 font-bold font-mono text-slate-800">Rp {iuran.jumlah.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">Rp {iuran.totalDibayar.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xxs font-bold ${
                          iuran.statusBayar === 'Lunas' ? 'bg-emerald-50 text-emerald-700' :
                          iuran.statusBayar === 'Kurang' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-red-700'
                        }`}>
                          {iuran.statusBayar}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          disabled={iuran.statusBayar === 'Lunas'}
                          onClick={() => {
                            setShowPayModal(iuran);
                            setPayAmount(iuran.jumlah - iuran.totalDibayar);
                            setPayKeterangan(`Setoran Iuran ${iuran.bulanTahun} - ${citizen.nama}`);
                          }}
                          className="py-1 px-2.5 rounded-lg border border-slate-100 hover:border-indigo-100 bg-white hover:bg-indigo-50/30 font-bold text-indigo-600 disabled:opacity-30 disabled:hover:bg-white text-xxs transition"
                        >
                          Bayar Iuran
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FileSpreadsheet className="w-10 h-10 mb-2 stroke-1" />
                      <p className="font-semibold text-sm">Tidak Ada Runtun Tagihan Ditemukan</p>
                      <p className="text-xs mt-1">Gunakan rilis tagihan baru atau cari bulan lainnya.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Realisasi Pengeluaran Kas */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xxs">
        <div className="p-5 border-b border-slate-100 bg-white">
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block animate-pulse"></span>
            Tabel Realisasi Pengeluaran Kas ({filterMonth})
          </h3>
          <p className="text-xs text-slate-500 mt-1">Daftar mutasi pengeluaran kas dusun yang disetujui untuk kegiatan operasional, pembangunan, dan bantuan sosial.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Tanggal</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Penanggung Jawab (PJ)</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Keterangan / Keperluan Pengeluaran</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {currentMonthExpenses.length > 0 ? (
                currentMonthExpenses.map((expense) => {
                  const citizen = citizenMap.get(expense.wargaId);
                  return (
                    <tr key={expense.id} className="hover:bg-rose-50/10 transition">
                      <td className="py-3 px-4 font-medium text-slate-500 font-mono">{expense.tanggal}</td>
                      <td className="py-3 px-4 font-bold text-slate-700">{citizen?.nama || 'Petugas / PJ'}</td>
                      <td className="py-3 px-4 text-slate-600 leading-relaxed font-medium">{expense.keterangan}</td>
                      <td className="py-3 px-4 text-right font-extrabold font-mono text-rose-650">
                        -Rp {expense.jumlah.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FileSpreadsheet className="w-10 h-10 mb-2 stroke-1 text-rose-300" />
                      <p className="font-semibold text-sm">Tidak Ada Pengeluaran</p>
                      <p className="text-xs mt-1">Belum ada pencatatan kas keluar untuk wilayah/periode ini.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Finance Mutasi Logs list */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100">
        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-3">
          <ArrowUpRight className="w-4.5 h-4.5 text-emerald-600" />
          Arus Mutasi Kas Keuangan Dusun
        </h3>
        <p className="text-xs text-slate-500 mb-4">Mutasi pembayaran warga terekam real-time langsung ke pembukuan.</p>

        <div className="space-y-2.5">
          {transaksiList.slice().reverse().filter(t => {
            const citizen = citizenMap.get(t.wargaId);
            return citizen && (isAdmin || citizen.rwId === userRwId);
          }).map((trans) => {
            const citizen = citizenMap.get(trans.wargaId);
            const isEntry = trans.jenis !== 'Keluar';
            return (
              <div key={trans.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs animate-fade-in">
                <div>
                  <p className="font-bold text-slate-800">{trans.keterangan}</p>
                  <p className="text-[10px] text-slate-450 mt-1 font-mono">
                    Tgl: {trans.tanggal} • {isEntry ? 'Kas Masuk' : 'Kas Keluar'} • PJ: {citizen?.nama || 'Petugas'}
                  </p>
                </div>
                <div>
                  <span className={`font-bold py-1 px-2.5 rounded-lg font-mono text-xs ${
                    isEntry ? 'text-emerald-705 bg-emerald-50/50' : 'text-rose-705 bg-rose-50/50'
                  }`}>
                    {isEntry ? '+' : '-'}Rp {trans.jumlah.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pay iuran Record modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xxs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-3 border-none">Setoran Pembayaran Iuran</h3>
            <p className="text-xs text-slate-500 mb-4">Setor iuran periode warga bersangkutan.</p>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Setoran Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  placeholder="25000"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Memo / Keterangan Khas</label>
                <input
                  type="text"
                  required
                  value={payDesc}
                  onChange={(e) => setPayKeterangan(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 text-xxs font-bold">
                <button
                  type="button"
                  onClick={() => setShowPayModal(null)}
                  className="px-4 py-2 border border-slate-150 rounded-xl hover:bg-slate-50 text-slate-600 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
                >
                  Kalkulasi Setor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rilis tagihan instan modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xxs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-3 border-none">Rilis Tagihan Baru Bulanan</h3>
            <p className="text-xs text-slate-500 mb-4 font-normal">Sistem akan secara otomatis mencari warga Dusun Sukamaju berstatus Aktif untuk ditarik iuran bulanan.</p>

            <div className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-500 mb-1">Periode Bulan & Tahun</label>
                <input
                  type="text"
                  value={newMonth}
                  onChange={(e) => setNewMonth(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Iuran Nominal Ditagih (Rp)</label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-mono"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 text-xxs font-bold">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-650 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleApplyDuesToAll}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  Rilis Tagihan Masal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Catat Pengeluaran */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-6 animate-fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-3">Catat Kas Pengeluaran</h3>
            <p className="text-xs text-slate-500 mb-4 font-normal">Mencatat pengeluaran keuangan dusun untuk operasional, perawatan, pembangunan, atau bantuan sosial warga.</p>
            
            <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs font-bold font-sans">
              <div>
                <label className="block text-slate-500 mb-1">Penanggung Jawab (PJ)</label>
                <select
                  value={expenseWargaId}
                  onChange={(e) => setExpenseWargaId(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  {wargaList.filter(w => isAdmin || w.rwId === userRwId).map(w => (
                    <option key={w.id} value={w.id}>
                      {w.nama} ({w.rwId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Nominal Dana Keluar (Rp)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expenseAmount || ''}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-sm"
                  placeholder="Contoh: 100000"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Tanggal Transaksi</label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Deskripsi / Keterangan Keperluan</label>
                <textarea
                  required
                  rows={3}
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Contoh: Pembelian lampu penerangan jalan RW 01"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-normal text-xs"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 text-xxs font-bold">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-650 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
