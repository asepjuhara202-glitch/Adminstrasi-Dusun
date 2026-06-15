import React, { useState } from 'react';
import { Pengajuan, Warga, User } from '../types';
import { ShieldAlert, Plus, CheckCircle, XCircle, Search, Heart, Sparkles, Trash2, Camera, MapPin, Globe, Image as ImageIcon, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BansosTabProps {
  currentUser: User | null;
  wargaList: Warga[];
  pengajuanList: Pengajuan[];
  onAddPengajuan: (pengajuan: Omit<Pengajuan, 'id' | 'tanggal' | 'status' | 'fotoList'>, files?: string[]) => Promise<void>;
  onUpdateStatus: (id: number, status: Pengajuan['status'], komentar?: string) => Promise<void>;
}

export function BansosTab({
  currentUser,
  wargaList,
  pengajuanList,
  onAddPengajuan,
  onUpdateStatus
}: BansosTabProps) {
  const isAdmin = currentUser?.role === 'Admin';
  const citizenMap = new Map(wargaList.map(w => [w.id, w]));

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState<Pengajuan | null>(null);

  // Form states
  const [wargaId, setWargaId] = useState<number>(() => {
    const eligibleWarga = wargaList.filter(w => isAdmin || w.rwId === currentUser?.rwId);
    return eligibleWarga[0]?.id || 1;
  });
  const [jenis, setJenis] = useState<'Rutilahu' | 'Pembangunan' | 'Bansos'>('Bansos');
  const [deskripsi, setDeskripsi] = useState('');
  const [koordinat, setKoordinat] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState('');
  
  // Review comments states
  const [komentar, setKomentar] = useState('');

  // Sync default wargaId Selection
  React.useEffect(() => {
    const eligibleWarga = wargaList.filter(w => isAdmin || w.rwId === currentUser?.rwId);
    if (eligibleWarga.length > 0) {
      setWargaId(eligibleWarga[0].id);
    }
  }, [currentUser, wargaList, isAdmin]);

  const filteredPengajuans = pengajuanList.filter(p => {
    const citizen = citizenMap.get(p.wargaId);
    if (!citizen) return false;

    // Restriction: Non-admin can only see/access requests in their own RW Sektor.
    if (!isAdmin && p.rwId !== currentUser?.rwId) return false;

    return citizen.nama.toLowerCase().includes(search.toLowerCase()) || 
           p.jenis.toLowerCase().includes(search.toLowerCase());
  });

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
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.line(15, 34, 195, 34);
      doc.setLineWidth(0.2);
      doc.line(15, 35.2, 195, 35.2);

      // Document Title
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.text('LAPORAN REKAPITULASI PENGAJUAN DATA BANTUAN SOSIAL', 105, 43, { align: 'center' });
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text(`Wilayah Sektor: ${isAdmin ? 'Semua RW Dusun' : (currentUser?.rwId || 'RW Sektor')}`, 15, 52);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 195, 52, { align: 'right' });

      // Summary statistics display box
      doc.setFillColor(248, 250, 252); // bg-slate-50
      doc.rect(15, 57, 180, 21, 'F');
      doc.setDrawColor(226, 232, 240); // border
      doc.rect(15, 57, 180, 21, 'S');

      const totalNum = filteredPengajuans.length;
      const setujuNum = filteredPengajuans.filter(p => p.status === 'Setuju').length;
      const verifNum = filteredPengajuans.filter(p => p.status === 'Verifikasi' || p.status === 'Draft' || p.status === 'Kirim').length;
      const tolakNum = filteredPengajuans.filter(p => p.status === 'Tolak').length;

      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.text('RINGKASAN STATUS PENGAJUAN BANSOS:', 20, 62);
      
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.text(`Total Usul Masuk : ${totalNum} berkas`, 20, 67.5);
      doc.text(`Status Disetujui   : ${setujuNum} berkas`, 20, 72.5);
      doc.text(`Sedang Verifikasi : ${verifNum} berkas`, 110, 67.5);
      doc.text(`Ditolak/Ditangguhkan : ${tolakNum} berkas`, 110, 72.5);

      // table rows
      const tableRows = filteredPengajuans.map((p, index) => {
        const citizen = citizenMap.get(p.wargaId);
        return [
          String(index + 1),
          citizen?.nama || 'Tidak Terdaftar',
          p.rwId || '-',
          p.jenis,
          p.deskripsi,
          p.koordinat || 'Tidak terekam',
          '', // Empty column slot for holding the drawn photos
          p.status
        ];
      });

      autoTable(doc, {
        head: [['No', 'Nama Pengusul', 'Wilayah', 'Kategori', 'Uraian Alasan Detail', 'Koordinat GPS', 'Foto Bukti', 'Status']],
        body: tableRows,
        startY: 84,
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
          valign: 'middle',
          minCellHeight: 18 // Elegant height to display up to 3 thumbnails side-by-side
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 26, fontStyle: 'bold' },
          2: { cellWidth: 12, halign: 'center' },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 40 },
          5: { cellWidth: 24, halign: 'center', fontStyle: 'italic', fontSize: 7 },
          6: { cellWidth: 34, halign: 'center' }, // Column slot designated for photos
          7: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        didDrawCell: (data) => {
          if (data.column.index === 6 && data.cell.section === 'body') {
            const rowIndex = data.row.index;
            const p = filteredPengajuans[rowIndex];
            if (p && p.fotoList && p.fotoList.length > 0) {
              const photos = p.fotoList.slice(0, 3); // Max 3 photos
              const cellX = data.cell.x;
              const cellY = data.cell.y;
              const cellW = data.cell.width;
              const cellH = data.cell.height;

              const count = photos.length;
              const padding = 1;
              const availW = cellW - (padding * (count + 1));
              const imgW = availW / count;
              const imgH = cellH - (padding * 2);

              photos.forEach((base64String, idx) => {
                try {
                  const targetX = cellX + padding + (idx * (imgW + padding));
                  const targetY = cellY + padding;
                  doc.addImage(base64String, 'JPEG', targetX, targetY, imgW, imgH);
                } catch (imgErr) {
                  // Graceful fallback for non-compliant browser artifacts or external links
                  console.warn('Unable to inject photo into PDF table cell:', imgErr);
                }
              });
            }
          }
        }
      });

      // Signature block
      const finalY = (doc as any).lastAutoTable.finalY || 120;
      let sigY = finalY + 15;
      if (sigY > 240) {
        doc.addPage();
        sigY = 25;
      }

      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text('Mengetahui / Menyetujui:', 135, sigY);
      doc.setFont('times', 'bold');
      doc.text(isAdmin ? 'Kepala Pemerataan Dusun' : `Ketua Wilayah ${currentUser?.rwId || 'RW'}`, 135, sigY + 6);
      doc.setDrawColor(200, 200, 200);
      doc.line(135, sigY + 28, 185, sigY + 28);
      
      doc.setFont('times', 'bold');
      doc.text(isAdmin ? 'Ibu Kades Rahma' : currentUser?.nama || 'Ketua RW Petugas', 135, sigY + 32);
      doc.setFont('times', 'normal');
      doc.text(isAdmin ? 'NIP. 19820712 201103 2 001' : `ID Pengawas: ${currentUser?.id || 'RW-001'}`, 135, sigY + 37);

      doc.save(`LAPORAN_BANSOS_DUSUN_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan saat mencetak PDF Laporan Bansos!');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const citizen = citizenMap.get(wargaId);
    if (!citizen) return;

    await onAddPengajuan({
      wargaId,
      rwId: citizen.rwId,
      jenis,
      deskripsi,
      koordinat: koordinat.trim() || undefined
    }, uploadedPhotos);

    setShowAddModal(false);
    setDeskripsi('');
    setKoordinat('');
    setUploadedPhotos([]);
    setGpsError('');
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung deteksi lokasi.');
      return;
    }
    setIsLocating(true);
    setGpsError('');

    // Try high-accuracy first with a quick timeout fallback
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setKoordinat(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
        setIsLocating(false);
      },
      (error) => {
        console.warn('High accuracy location failed. Retrying with low-accuracy Wi-Fi/IP method...', error);
        
        // Fallback to low-accuracy (works perfectly on desktop, standard networks, and inside sandbox sandboxed context)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setKoordinat(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
            setIsLocating(false);
          },
          (err2) => {
            console.error('Lower accuracy fallback location failed:', err2);
            let errMsg = 'Gagal mendeteksi lokasi GPS.';
            if (err2.code === 1) {
              errMsg = 'Izin lokasi ditolak browser. Hubungi / periksa setting browser Anda.';
            } else if (err2.code === 2) {
              errMsg = 'Posisi tidak tersedia di jaringan ini.';
            } else if (err2.code === 3) {
              errMsg = 'Deteksi lokasi timeout.';
            }
            setGpsError(errMsg);
            setIsLocating(false);
          },
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 3500 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const remainingSlots = 3 - uploadedPhotos.length;
    const filesArray = Array.from(files).slice(0, remainingSlots);

    filesArray.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadedPhotos((prev) => [...prev, reader.result as string].slice(0, 3));
        }
      };
      reader.readAsDataURL(file as any);
    });
  };

  return (
    <div className="space-y-6">
      {/* Informative banners */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 p-5 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <h4 className="font-bold text-amber-900 text-sm">Otorisasi & Kebijakan Bansos Desa</h4>
          <p className="text-amber-700 mt-1 leading-relaxed">Pengusulan program bantuan sosial (Bansos, Rutilahu, Pembangunan) dapat diajukan oleh masing-masing Ketua RW. Persetujuan dan pencairan dana bantuan sepenuhnya dikontrol secara ketat oleh Kepala Dusun / Kades untuk menjamin keadilan sosial.</p>
        </div>
      </div>

      {/* Controller area */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pengajuan / jenis bantuan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 text-xs font-semibold"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportPDF}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
          >
            <FileDown className="w-4 h-4" />
            Cetak PDF
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Ajukan Bantuan Sosial
          </button>
        </div>
      </div>

      {/* Grid displays of Active submissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPengajuans.length > 0 ? (
          filteredPengajuans.map((pengajuan) => {
            const citizen = citizenMap.get(pengajuan.wargaId);
            if (!citizen) return null;
            return (
              <div key={pengajuan.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between hover:shadow-xs transition">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xxs uppercase tracking-wider font-extrabold text-indigo-600 bg-indigo-50/50 py-1 px-2.5 rounded-lg">
                      PRG: {pengajuan.jenis}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xxs font-bold ${
                      pengajuan.status === 'Setuju' ? 'bg-emerald-50 text-emerald-700' :
                      pengajuan.status === 'Tolak' ? 'bg-red-50 text-red-700' :
                      pengajuan.status === 'Verifikasi' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {pengajuan.status === 'Verifikasi' ? 'Menunggu Verifikasi' : pengajuan.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm">{citizen.nama}</h4>
                  <p className="text-xxs text-slate-400 mt-0.5">NIK: {citizen.nik} • RW Wilayah: {citizen.rwId}</p>
                  
                  <p className="text-xs text-slate-600 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-medium">
                    {pengajuan.deskripsi}
                  </p>

                  {pengajuan.komentar && (
                    <div className="mt-3 p-2.5 bg-indigo-50/40 rounded-xl border border-indigo-100/50 text-xxs text-indigo-700 leading-relaxed">
                      <span className="font-bold">Komentar Dusun:</span> {pengajuan.komentar}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                  <span className="text-xxs font-semibold text-slate-400">Diajukan: {pengajuan.tanggal}</span>
                  
                  <button
                    onClick={() => {
                      setShowReviewModal(pengajuan);
                      setKomentar(pengajuan.komentar || '');
                    }}
                    className="py-1 px-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-xxs font-bold text-slate-700 border border-slate-150 transition"
                  >
                    {isAdmin ? 'Tanggapi / Tinjau' : 'Detail'}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-10 bg-white rounded-2xl border border-slate-100">
            <div className="flex flex-col items-center justify-center text-slate-400">
              <Heart className="w-10 h-10 mb-2 stroke-1" />
              <p className="font-semibold text-sm">Belum Ada Pengajuan Bantuan Sosial</p>
              <p className="text-xs mt-1">Ketua RW dipersilakan mendaftarkan warga kurang mampu.</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Aid Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xxs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-3 border-none">Form Pengajuan Bantuan Sosial</h3>
            
            <form onSubmit={handleCreate} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Pilih Calon Penerima Bantuan</label>
                <select
                  value={wargaId}
                  onChange={(e) => setWargaId(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                >
                  {wargaList.filter(w => isAdmin || w.rwId === currentUser?.rwId).map(w => (
                    <option key={w.id} value={w.id}>{w.nama} (RT {w.rt || '-'} / {w.rwId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Program / Jenis Bantuan</label>
                <select
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                >
                  <option value="Bansos">Bansos BLT / Sembako Sembilan Bahan Pokok</option>
                  <option value="Rutilahu">Rutilahu (Renovasi Rumah Tidak Layak Huni)</option>
                  <option value="Pembangunan">Pembangunan Sarana Prasarana Lingkungan</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Deskripsi Kondisi & Alasan Pengajuan</label>
                <textarea
                  required
                  rows={3}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Deskripsikan kondisi rill kelayakan warga menerima bantuan..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 leading-normal"
                />
              </div>

              {/* Coordinates Field */}
              <div>
                <label className="block text-slate-500 mb-1">Titik Koordinat Lokasi (Latitude, Longitude)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={koordinat}
                    onChange={(e) => setKoordinat(e.target.value)}
                    placeholder="cth: -6.2088, 106.8456"
                    className="flex-grow px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-xxs"
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl hover:border-indigo-200 transition text-[10px] font-bold shrink-0 flex items-center gap-1"
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {isLocating ? 'Mendeteksi...' : 'GPS'}
                  </button>
                </div>
                {gpsError && (
                  <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                    {gpsError}
                  </p>
                )}
                <span className="text-[9px] text-slate-400 mt-0.5 block leading-tight">Gunakan tombol GPS atau masukkan koordinat secara manual.</span>
              </div>

              {/* Photo Uploading (Up to 3 Photos) */}
              <div>
                <label className="block text-slate-500 mb-1">Foto Bukti Lapangan / Rencana Renovasi (Maks 3 Foto)</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {uploadedPhotos.map((photo, index) => (
                    <div key={index} className="relative aspect-video rounded-xl border border-slate-200 overflow-hidden group bg-slate-50 flex items-center justify-center">
                      <img src={photo} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setUploadedPhotos((prev) => prev.filter((_, i) => i !== index))}
                        className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150 rounded-xl text-xxs font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-0.5" />
                        Hapus
                      </button>
                    </div>
                  ))}
                  {uploadedPhotos.length < 3 && (
                    <label className="aspect-video rounded-xl border border-dashed border-slate-300 hover:border-indigo-500 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer transition text-center p-1">
                      <Camera className="w-4 h-4 text-slate-400 mb-0.5" />
                      <span className="text-[9px] text-slate-500">Pilih Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        multiple={3 - uploadedPhotos.length > 1}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 text-xxs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setGpsError('');
                  }}
                  className="px-4 py-2 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-650"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                >
                  Ajukan Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Request Modal (Admin only, or read-only details for user) */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xxs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-3 border-none">Lembar Peninjauan Proposal</h3>
            
            <div className="space-y-4 text-xs font-semibold">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1 text-slate-600">
                <p><span className="font-bold text-slate-700">Warga:</span> {citizenMap.get(showReviewModal.wargaId)?.nama}</p>
                <p><span className="font-bold text-slate-700">Wilayah:</span> {showReviewModal.rwId}</p>
                <p><span className="font-bold text-slate-700">Program:</span> {showReviewModal.jenis}</p>
                <p><span className="font-bold text-slate-700">Tanggal:</span> {showReviewModal.tanggal}</p>
              </div>

              <div>
                <p className="block text-slate-500 mb-1">Deskripsi Kondisi:</p>
                <p className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 font-medium italic select-all text-slate-700">{showReviewModal.deskripsi}</p>
              </div>

              {/* Coordinates display in Review modal */}
              {showReviewModal.koordinat && (
                <div>
                  <p className="block text-slate-500 mb-1">Titik Koordinat Lokasi:</p>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xxs font-semibold text-slate-705">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="font-mono">{showReviewModal.koordinat}</span>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(showReviewModal.koordinat)}`}
                      target="_blank" 
                      rel="noreferrer"
                      className="ml-auto text-indigo-600 hover:underline font-bold shrink-0 flex items-center gap-0.5"
                    >
                      <Globe className="w-3.5 h-3.5" /> Lihat di Google Maps
                    </a>
                  </div>
                </div>
              )}

              {/* Photos rendering list inside review Modal */}
              {showReviewModal.fotoList && showReviewModal.fotoList.length > 0 && (
                <div>
                  <p className="block text-slate-500 mb-1">Foto Bukti Lapangan ({showReviewModal.fotoList.length}):</p>
                  <div className="grid grid-cols-3 gap-2">
                    {showReviewModal.fotoList.map((foto, idx) => (
                      <div key={idx} className="aspect-video rounded-xl border border-slate-200 overflow-hidden bg-slate-100 relative group">
                        <img 
                          src={foto} 
                          alt={`Bukti ${idx + 1}`} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition"
                          onClick={() => {
                            const w = window.open();
                            if (w) w.document.write(`<img src="${foto}" style="max-width:100%; max-height:100vh;" />`);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isAdmin ? (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-slate-500 mb-1">Komentar / Keputusan Administratif</label>
                    <input
                      type="text"
                      value={komentar}
                      onChange={(e) => setKomentar(e.target.value)}
                      placeholder="cth. Terverifikasi berhak menerima paket sembako"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex gap-2 text-xxs font-bold">
                    <button
                      onClick={async () => {
                        await onUpdateStatus(showReviewModal.id, 'Tolak', komentar);
                        setShowReviewModal(null);
                      }}
                      className="flex-grow py-2.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl transition inline-flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Tolak Proposal
                    </button>
                    <button
                      onClick={async () => {
                        await onUpdateStatus(showReviewModal.id, 'Setuju', komentar);
                        setShowReviewModal(null);
                      }}
                      className="flex-grow py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition inline-flex items-center justify-center gap-1 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Setujui Bantuan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 space-y-2">
                  {showReviewModal.komentar && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-650">
                      <p className="font-bold text-slate-705">Tanggapan Kadus:</p>
                      <p className="font-medium italic">{showReviewModal.komentar}</p>
                    </div>
                  )}
                  <p className="font-bold text-indigo-700 text-xxs flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Menunggu verifikasi lanjutan dari Kepala Dusun.
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(null)}
                  className="px-4 py-2 border border-slate-150 rounded-xl hover:bg-slate-50 font-bold text-xxs"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
