import React, { useState } from 'react';
import { Warga, RW, User, PenerimaBantuan } from '../types';
import { Search, Plus, Edit, Trash2, FileDown, Heart, Sparkles, Gift, Info, Calendar, UserCheck, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PenerimaTabProps {
  currentUser: User | null;
  wargaList: Warga[];
  rwList: RW[];
  penerimaBantuanList: PenerimaBantuan[];
  onAddPenerimaBantuan: (penerima: Omit<PenerimaBantuan, 'id' | 'tanggalInput'>) => Promise<void>;
  onEditPenerimaBantuan: (id: number, edits: Partial<PenerimaBantuan>) => Promise<void>;
  onRemovePenerimaBantuan: (id: number) => Promise<void>;
}

export function PenerimaTab({
  currentUser,
  wargaList,
  rwList,
  penerimaBantuanList,
  onAddPenerimaBantuan,
  onEditPenerimaBantuan,
  onRemovePenerimaBantuan
}: PenerimaTabProps) {
  const isAdmin = currentUser?.role === 'Admin';
  const activeRwId = currentUser?.rwId || 'RW 01';

  // Sub-tabs for aid programs
  const bantuanCategories = ['PKH', 'PKH+BPNT', 'BANTUAN PANGAN', 'Bantuan Lainnya'] as const;
  type BantuanCategory = typeof bantuanCategories[number];
  const [activeCategory, setActiveCategory] = useState<BantuanCategory>('PKH');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterRw, setFilterRw] = useState(() => isAdmin ? 'ALL' : activeRwId);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPenerima, setEditingPenerima] = useState<PenerimaBantuan | null>(null);

  // Form States
  const [formWargaId, setFormWargaId] = useState<number>(0);
  const [formJenisBantuan, setFormJenisBantuan] = useState<BantuanCategory>('PKH');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formNominal, setFormNominal] = useState('');
  const [formRwId, setFormRwId] = useState(() => isAdmin ? 'RW 01' : activeRwId);

  // Synchronise default form states when modal opens
  const openFormForCreate = () => {
    // Select first eligible resident
    const eligibleWarga = wargaList.filter(w => isAdmin ? w.rwId === formRwId : w.rwId === activeRwId);
    if (eligibleWarga.length > 0) {
      setFormWargaId(eligibleWarga[0].id);
    } else {
      setFormWargaId(0);
    }
    setFormJenisBantuan(activeCategory);
    setFormKeterangan('');
    setFormNominal('');
    setShowAddModal(true);
  };

  const openFormForEdit = (penerima: PenerimaBantuan) => {
    setEditingPenerima(penerima);
    setFormWargaId(penerima.wargaId);
    setFormJenisBantuan(penerima.jenisBantuan);
    setFormKeterangan(penerima.keterangan);
    setFormNominal(penerima.nominal || '');
    setFormRwId(penerima.rwId);
  };

  // Keep citizen in sync when form RW changes
  React.useEffect(() => {
    if (showAddModal && !editingPenerima) {
      const eligibleWarga = wargaList.filter(w => isAdmin ? w.rwId === formRwId : w.rwId === activeRwId);
      if (eligibleWarga.length > 0) {
        setFormWargaId(eligibleWarga[0].id);
      } else {
        setFormWargaId(0);
      }
    }
  }, [formRwId, wargaList, isAdmin, activeRwId, showAddModal, editingPenerima]);

  // Citizen map for quick details lookup
  const citizenMap = new Map(wargaList.map(w => [w.id, w]));
  const rwMap = new Map(rwList.map(rw => [rw.id, rw]));

  // Filtering list
  const filteredList = penerimaBantuanList.filter(p => {
    // 1. Correct assistance category
    if (p.jenisBantuan !== activeCategory) return false;

    // 2. RW boundary restriction
    if (!isAdmin && p.rwId !== activeRwId) return false;
    if (isAdmin && filterRw !== 'ALL' && p.rwId !== filterRw) return false;

    // 3. Search query
    const citizen = citizenMap.get(p.wargaId);
    if (!citizen) return false;

    const matchesSearch = citizen.nama.toLowerCase().includes(search.toLowerCase()) ||
                          citizen.nik.includes(search) ||
                          p.keterangan.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWargaId) {
      alert('Pilihlah salah satu warga terlebih dahulu!');
      return;
    }

    const citizen = citizenMap.get(formWargaId);
    if (!citizen) return;

    await onAddPenerimaBantuan({
      wargaId: formWargaId,
      jenisBantuan: formJenisBantuan,
      keterangan: formKeterangan,
      nominal: formNominal.trim() || undefined,
      rwId: citizen.rwId
    });

    setShowAddModal(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPenerima) return;

    const citizen = citizenMap.get(formWargaId);
    if (!citizen) return;

    await onEditPenerimaBantuan(editingPenerima.id, {
      wargaId: formWargaId,
      jenisBantuan: formJenisBantuan,
      keterangan: formKeterangan,
      nominal: formNominal.trim() || undefined,
      rwId: citizen.rwId
    });

    setEditingPenerima(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus penerima bantuan ini?')) {
      await onRemovePenerimaBantuan(id);
    }
  };

  // Professional PDF Export with Kop Surat Pengurus RW Sektor
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // Find current RW administrator details for Kop Surat
      const displayRwId = isAdmin ? (filterRw === 'ALL' ? 'RW 01' : filterRw) : activeRwId;
      const currentRwObj = rwMap.get(displayRwId);
      const ketuaRwName = currentRwObj?.namaKetua || 'Asep Juhara';
      const wilayahRw = currentRwObj?.wilayah || 'Sektor Wilayah Utama';
      const kontakRw = currentRwObj?.kontak || '-';

      // 1. Kop Surat Pengurus RW (Rukun Warga)
      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      doc.text('PENGURUS RUKUN WARGA (RW) SUKAMAJU MANDIRI', 105, 14, { align: 'center' });
      doc.setFontSize(11);
      doc.text(`WILAYAH ADMINISTRASI: ${displayRwId.toUpperCase()}`, 105, 19, { align: 'center' });
      doc.setFontSize(14);
      doc.text('PEMERINTAH DESA SUKAMAJU KECAMATAN SUKAMAJU', 105, 25, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('times', 'normal');
      doc.text(`Alamat Sektor: Sektor ${displayRwId}, ${wilayahRw}, Dusun Sukamaju. Kontak: ${kontakRw}`, 105, 30, { align: 'center' });

      // Double styling line separation under Kop Surat
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.line(15, 33, 195, 33);
      doc.setLineWidth(0.2);
      doc.line(15, 34.2, 195, 34.2);

      // Title of Document
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.text(`DAFTAR PENERIMA BANTUAN SOSIAL (${activeCategory})`, 105, 42, { align: 'center' });
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text(`Sektor Rukun Warga : ${isAdmin && filterRw === 'ALL' ? 'Semua RW Dusun' : displayRwId}`, 15, 50);
      doc.text(`Tanggal Unduh      : ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 195, 50, { align: 'right' });

      const tableRows = filteredList.map((p, index) => {
        const citizen = citizenMap.get(p.wargaId);
        return [
          String(index + 1),
          citizen?.nik || '-',
          citizen?.nama || 'Tidak Terdaftar',
          `RT ${citizen?.rt || '-'} / ${p.rwId}`,
          p.jenisBantuan,
          p.nominal || 'Sesuai Ketentuan',
          p.keterangan,
          p.tanggalInput
        ];
      });

      autoTable(doc, {
        head: [['No', 'NIK', 'Nama Lengkap', 'RT/RW', 'Jenis Bantuan', 'Rincian / Nominal', 'Keterangan Kelayakan', 'Tgl Verifikasi']],
        body: tableRows,
        startY: 56,
        theme: 'grid',
        headStyles: {
          fillColor: [79, 70, 229], // Indigo-600
          textColor: [255, 255, 255],
          font: 'times',
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'center',
          valign: 'middle'
        },
        bodyStyles: {
          font: 'times',
          fontSize: 8,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 26, halign: 'center' },
          2: { cellWidth: 32, fontStyle: 'bold' },
          3: { cellWidth: 16, halign: 'center' },
          4: { cellWidth: 26, halign: 'center' },
          5: { cellWidth: 28 },
          6: { cellWidth: 32 },
          7: { cellWidth: 18, halign: 'center' }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      });

      // Signature section under table
      const finalY = (doc as any).lastAutoTable.finalY || 100;
      let sigY = finalY + 15;
      if (sigY > 240) {
        doc.addPage();
        sigY = 25;
      }

      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text(`Sukamaju, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 135, sigY);
      doc.text('Mengetahui,', 135, sigY + 5);
      doc.setFont('times', 'bold');
      doc.text(`Ketua Pengurus ${displayRwId}`, 135, sigY + 10);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(135, sigY + 32, 185, sigY + 32);
      
      doc.text(ketuaRwName, 135, sigY + 36);
      doc.setFont('times', 'normal');
      doc.text(`NIP/NIK Pengurus: ${displayRwId}-001`, 135, sigY + 41);

      doc.save(`PENERIMA_${activeCategory}_${displayRwId.replace(/\s+/g, '')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan saat memexport PDF laporan!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Decorative Intro Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100/80 dark:border-indigo-900/50 p-5 rounded-2xl flex items-start gap-4">
        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-xl">
          <Gift className="w-5 h-5 animate-bounce" />
        </div>
        <div className="text-xs">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-100 text-sm">Validasi Penerima Bantuan Sosial</h4>
          <p className="text-indigo-750 dark:text-indigo-300 mt-1 leading-relaxed">
            Halaman ini mempermudah pencatatan penerima bantuan kesejahteraan sosial tingkat RW. Disusun rapi dalam empat program utama: <strong>PKH</strong>, <strong>PKH+BPNT</strong>, <strong>BANTUAN PANGAN</strong>, dan <strong>Bantuan Lainnya</strong>.
          </p>
        </div>
      </div>

      {/* Program Category Switcher Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 max-w-full overflow-x-auto gap-1">
        {bantuanCategories.map((category) => {
          const count = penerimaBantuanList.filter(p => p.jenisBantuan === category && (isAdmin || p.rwId === activeRwId)).length;
          return (
            <button
              key={category}
              onClick={() => {
                setActiveCategory(category);
                setSearch('');
              }}
              className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
                activeCategory === category
                  ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-md font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <span>{category}</span>
              <span className={`text-[10px] py-0.5 px-2 rounded-full ${
                activeCategory === category
                  ? 'bg-indigo-50 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center transition-colors">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:max-w-xl">
          {/* Search box */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Cari nama, NIK, atau alasan kelayakan ${activeCategory}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-xs font-semibold"
            />
          </div>

          {/* RW Filter for admin */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 min-w-[140px]">
              <span className="text-xxs font-bold text-slate-400">RW:</span>
              <select
                value={filterRw}
                onChange={(e) => setFilterRw(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 focus:outline-none"
              >
                <option value="ALL">Semua RW</option>
                {rwList.map(rw => (
                  <option key={rw.id} value={rw.id}>{rw.id}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Print & Add Recipient Buttons */}
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={handleExportPDF}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Kop PDF {activeCategory}
          </button>
          <button
            onClick={openFormForCreate}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Penerima
          </button>
        </div>
      </div>

      {/* Main Table for Welfare Recipients */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xxs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 font-bold text-xxs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="py-4 px-4 w-12 text-center text-slate-450">No</th>
                <th className="py-4 px-4">Nama Penerima Bantuan</th>
                <th className="py-4 px-4 w-36">NIK / KK</th>
                <th className="py-4 px-4 w-24 text-center">RT / RW</th>
                <th className="py-4 px-4">Rincian / Nominal</th>
                <th className="py-4 px-4">Keterangan / Alasan Layak</th>
                <th className="py-4 px-4 w-28 text-center">Tgl Verifikasi</th>
                <th className="py-4 px-4 w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium">
              {filteredList.length > 0 ? (
                filteredList.map((penerima, index) => {
                  const citizen = citizenMap.get(penerima.wargaId);
                  if (!citizen) return null;
                  return (
                    <tr key={penerima.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400 font-mono">{index + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-850 dark:text-slate-100">{citizen.nama}</span>
                            <span className="block text-[10px] text-slate-400">Gender: {citizen.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-xxs leading-relaxed">
                        <div>NIK: {citizen.nik}</div>
                        <div>KK: {citizen.kk}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-lg text-xxs font-bold">
                          RT {citizen.rt || '-'} / {penerima.rwId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-indigo-600 dark:text-indigo-400 font-bold">
                        {penerima.nominal || 'Sesuai Juknis'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-550 dark:text-slate-450 italic max-w-xs truncate" title={penerima.keterangan}>
                        {penerima.keterangan}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-xxs">
                        {penerima.tanggalInput}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openFormForEdit(penerima)}
                            className="p-1 text-blue-650 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                            title="Edit Data"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(penerima.id)}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Heart className="w-10 h-10 mx-auto stroke-1 mb-2 text-slate-350" />
                    <p className="font-bold text-sm">Belum Ada Warga Terdaftar</p>
                    <p className="text-xxs mt-0.5">Silakan tambahkan data menggunakan tombol tambah di atas.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Beneficiary Modal */}
      {(showAddModal || editingPenerima) && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xxs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-md w-full p-6 transition-colors">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Gift className="w-4 h-4 text-indigo-500" />
                {editingPenerima ? `Edit Penerima ${activeCategory}` : `Tambah Penerima ${activeCategory}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingPenerima(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingPenerima ? handleUpdate : handleCreate} className="space-y-4 text-xs font-semibold">
              {/* Select RW filter (Only during addition and only for Admin) */}
              {!editingPenerima && isAdmin && (
                <div>
                  <label className="block text-slate-500 dark:text-slate-450 mb-1">Filter RW asal Warga</label>
                  <select
                    value={formRwId}
                    onChange={(e) => setFormRwId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:outline-none"
                  >
                    {rwList.map(rw => (
                      <option key={rw.id} value={rw.id}>{rw.id} - Ketua: {rw.namaKetua}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Select citizen */}
              <div>
                <label className="block text-slate-500 dark:text-slate-450 mb-1">Pilih Warga </label>
                {editingPenerima ? (
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                    {citizenMap.get(formWargaId)?.nama} (NIK: {citizenMap.get(formWargaId)?.nik})
                  </div>
                ) : (
                  <select
                    value={formWargaId}
                    onChange={(e) => setFormWargaId(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                    required
                  >
                    <option value="">-- Silakan Pilih Warga --</option>
                    {wargaList
                      .filter(w => isAdmin ? w.rwId === formRwId : w.rwId === activeRwId)
                      .map(w => (
                        <option key={w.id} value={w.id}>{w.nama} (RT {w.rt || '-'} / NIK: {w.nik})</option>
                      ))}
                  </select>
                )}
                <p className="text-[10px] text-slate-400 mt-1">Hanya warga aktif di sektor RW terdaftar yang dapat dipilih.</p>
              </div>

              {/* Assistance type / program selection */}
              <div>
                <label className="block text-slate-500 dark:text-slate-450 mb-1">Program Bantuan Sosial</label>
                <select
                  value={formJenisBantuan}
                  onChange={(e) => setFormJenisBantuan(e.target.value as BantuanCategory)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:outline-none"
                  required
                >
                  <option value="PKH">PKH (Program Keluarga Harapan)</option>
                  <option value="PKH+BPNT">PKH + BPNT (Bantuan Pangan Non Tunai)</option>
                  <option value="BANTUAN PANGAN">BANTUAN PANGAN (Sembako Bulanan)</option>
                  <option value="Bantuan Lainnya">Bantuan Lainnya (BLT Dana Desa, dll)</option>
                </select>
              </div>

              {/* assistance description / nominal */}
              <div>
                <label className="block text-slate-500 dark:text-slate-450 mb-1">Rincian Nominal / Barang Bantuan</label>
                <input
                  type="text"
                  value={formNominal}
                  onChange={(e) => setFormNominal(e.target.value)}
                  placeholder="cth: Rp 600.000 / beras 10 Kg / Paket Sembako"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:outline-none text-xs"
                />
              </div>

              {/* Justification note */}
              <div>
                <label className="block text-slate-500 dark:text-slate-450 mb-1">Alasan Kelayakan Kelompok Sasaran</label>
                <textarea
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  required
                  rows={3}
                  placeholder="cth: Kategori Lansia pra-sejahtera, yatim, atau janda tanggungan sekolah..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:outline-none leading-normal text-xs"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-800 text-xxs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPenerima(null);
                  }}
                  className="px-4 py-2 border border-slate-150 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer"
                >
                  {editingPenerima ? 'Simpan Perubahan' : 'Daftarkan Penerima'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
