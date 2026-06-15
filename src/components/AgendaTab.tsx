import React, { useState } from 'react';
import { JadwalRonda, KegiatanRutin, Warga, User } from '../types';
import { ShieldCheck, Plus, Calendar, Clock, MapPin, BadgeCheck, Users, Trash2, ShieldAlert, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AgendaTabProps {
  currentUser: User | null;
  wargaList: Warga[];
  rondaList: JadwalRonda[];
  kegiatanList: KegiatanRutin[];
  onAddRonda: (ronda: Omit<JadwalRonda, 'id'>) => Promise<void>;
  onRemoveRonda: (id: number) => Promise<void>;
  onAddKegiatan: (kegiatan: Omit<KegiatanRutin, 'id'>) => Promise<void>;
  onRemoveKegiatan: (id: number) => Promise<void>;
}

export function AgendaTab({
  currentUser,
  wargaList,
  rondaList,
  kegiatanList,
  onAddRonda,
  onRemoveRonda,
  onAddKegiatan,
  onRemoveKegiatan
}: AgendaTabProps) {
  const [showRondaModal, setShowRondaModal] = useState(false);
  const [showKegiatanModal, setShowKegiatanModal] = useState(false);

  // Ronda Form State
  const [rondaHari, setRondaHari] = useState<JadwalRonda['hari']>('Senin');
  const [rondaWargas, setRondaWargas] = useState<number[]>([]);
  const [rondaSektor, setRondaSektor] = useState('Pos Ronda RT 01');
  const [rondaJamMulai, setRondaJamMulai] = useState('22:00');
  const [rondaJamSelesai, setRondaJamSelesai] = useState('04:00');
  const [rondaKet, setRondaKet] = useState('');

  // Agenda Form State
  const [kegiatanNama, setKegiatanNama] = useState('');
  const [kegiatanKat, setKegiatanKat] = useState<KegiatanRutin['kategori']>('Kesehatan');
  const [kegiatanFrek, setKegiatanFrekuensi] = useState('Satu bulan sekali');
  const [kegiatanLok, setKegiatanLokasi] = useState('');
  const [kegiatanWakt, setKegiatanWaktu] = useState('08:00 - selesai');
  const [kegiatanPj, setKegiatanPenanggungJawab] = useState('');
  const [kegiatanDesk, setKegiatanDeskripsi] = useState('');

  const citizenMap = new Map(wargaList.map(w => [w.id, w]));
  const isAdmin = currentUser?.role === 'Admin';
  const userRwId = currentUser?.rwId;

  const filteredRondaList = rondaList.filter(r => isAdmin || r.rwId === userRwId);
  const filteredKegiatanList = kegiatanList.filter(k => isAdmin || k.rwId === userRwId);

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
      doc.text('LAPORAN ROSTER KEAMANAN RONDA SISKAMLING & AGENDA DESA', 105, 43, { align: 'center' });
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text(`Wilayah Sektor: ${isAdmin ? 'Semua RW Dusun' : (currentUser?.rwId || 'RW Sektor')}`, 15, 52);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 195, 52, { align: 'right' });

      // Section 1 Heading
      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(79, 70, 229); // Indigo heading
      doc.text('I. DAFTAR PETUGAS RONDA MALAM SISKAMLING', 15, 60);
      doc.setTextColor(0, 0, 0);

      // Ronda Table rows
      const rondaRows = filteredRondaList.map((r, index) => {
        const names = r.wargaIds
          .map(id => citizenMap.get(id)?.nama || '')
          .filter(Boolean)
          .join(', ');
        return [
          String(index + 1),
          r.hari,
          r.lokasiSektor,
          `${r.jamMulai} - ${r.jamSelesai}`,
          names || 'Tidak ada petugas ditunjuk',
          r.keterangan || '-'
        ];
      });

      autoTable(doc, {
        head: [['No', 'Hari Piket', 'Lokasi Pos / Sektor', 'Waktu Patroli', 'Daftar Petugas Warga', 'Memo/Catatan']],
        body: rondaRows,
        startY: 64,
        theme: 'grid',
        headStyles: {
          fillColor: [79, 70, 229], // Indigo-600
          textColor: [255, 255, 255],
          font: 'times',
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'center'
        },
        bodyStyles: {
          font: 'times',
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 32, fontStyle: 'bold' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 60 },
          5: { cellWidth: 35 }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      });

      // Section 2 Heading
      const afterRondaY = (doc as any).lastAutoTable.finalY || 120;
      let sect2Y = afterRondaY + 12;
      if (sect2Y > 260) {
        doc.addPage();
        sect2Y = 25;
      }

      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(219, 39, 119); // Pink/Rose heading
      doc.text('II. DAFTAR AGENDA KEGIATAN RUTIN WARGA', 15, sect2Y);
      doc.setTextColor(0, 0, 0);

      const kegiatanRows = filteredKegiatanList.map((k, index) => {
        return [
          String(index + 1),
          k.nama,
          k.kategori,
          k.frekuensi,
          k.lokasi,
          k.waktu,
          k.penanggungJawab,
          k.deskripsi || '-'
        ];
      });

      autoTable(doc, {
        head: [['No', 'Nama Kegiatan', 'Kategori', 'Frekuensi', 'Lokasi Acara', 'Waktu', 'P. Jawab', 'Rincian Acara']],
        body: kegiatanRows,
        startY: sect2Y + 4,
        theme: 'grid',
        headStyles: {
          fillColor: [219, 39, 119], // Rose-600
          textColor: [255, 255, 255],
          font: 'times',
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'center'
        },
        bodyStyles: {
          font: 'times',
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 35, fontStyle: 'bold' },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 22, halign: 'center' },
          4: { cellWidth: 28 },
          5: { cellWidth: 22 },
          6: { cellWidth: 22 },
          7: { cellWidth: 25 }
        },
        alternateRowStyles: {
          fillColor: [253, 244, 245]
        }
      });

      // Signature block
      const finalY = (doc as any).lastAutoTable.finalY || 180;
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

      doc.save(`LAPORAN_AGENDA_RONDA_DUSUN_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan saat mencetak PDF Laporan Ronda & Agenda Dusun!');
    }
  };

  const handleCreateRonda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rondaWargas.length === 0) {
      alert('Pilih setidaknya 1 petugas ronda!');
      return;
    }

    await onAddRonda({
      rwId: currentUser?.rwId || 'RW 01',
      hari: rondaHari,
      wargaIds: rondaWargas,
      lokasiSektor: rondaSektor,
      jamMulai: rondaJamMulai,
      jamSelesai: rondaJamSelesai,
      keterangan: rondaKet
    });

    setShowRondaModal(false);
    setRondaWargas([]);
    setRondaKet('');
  };

  const handleCreateKegiatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kegiatanNama.trim() || !kegiatanLok.trim()) {
      alert('Nama kegiatan and lokasi wajib diisi!');
      return;
    }

    await onAddKegiatan({
      rwId: currentUser?.rwId || 'RW 01',
      nama: kegiatanNama,
      kategori: kegiatanKat,
      frekuensi: kegiatanFrek,
      lokasi: kegiatanLok,
      waktu: kegiatanWakt,
      penanggungJawab: kegiatanPj,
      deskripsi: kegiatanDesk
    });

    setShowKegiatanModal(false);
    // Reset Form
    setKegiatanNama('');
    setKegiatanLokasi('');
    setKegiatanPenanggungJawab('');
    setKegiatanDeskripsi('');
  };

  const handleWargaSelectionToggle = (wargaId: number) => {
    if (rondaWargas.includes(wargaId)) {
      setRondaWargas(rondaWargas.filter(id => id !== wargaId));
    } else {
      setRondaWargas([...rondaWargas, wargaId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cetak PDF Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-xxs">
        <div className="text-left">
          <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wide">Cetak Agenda & Roster Jadwal Siskamling</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">Dapatkan salinan Laporan resmi untuk dipasang di papan pengumuman warga.</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
        >
          <FileDown className="w-4 h-4" />
          Cetak Jadwal PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 1. Neighborhood Ronda night patrol roster Column */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" />
              Roster Jadwal Ronda Siskamling
            </h3>
            <button
              onClick={() => setShowRondaModal(true)}
              className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xxs font-bold text-indigo-700 transition"
            >
              + Ronda Baru
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-5 leading-normal">Meningkatkan keamanan lingkungan melalui jadwal ronda bergilir warga siskamling Sukamaju.</p>

          <div className="space-y-4">
            {filteredRondaList.length > 0 ? (
              filteredRondaList.map((ronda) => (
                <div key={ronda.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-indigo-700 uppercase">{ronda.hari} • {ronda.lokasiSektor}</span>
                    <span className="text-xxs font-medium text-slate-400 inline-flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" /> {ronda.jamMulai} - {ronda.jamSelesai}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 items-center mb-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 mr-1" />
                    {ronda.wargaIds.map(id => {
                      const citizen = citizenMap.get(id);
                      return (
                        <span key={id} className="inline-flex items-center gap-1 bg-white border border-slate-100 py-0.5 px-2 rounded-md text-xxs font-bold text-slate-700">
                          {citizen?.nama || 'Terpindah / Tiada'}
                        </span>
                      );
                    })}
                  </div>

                  {ronda.keterangan && (
                    <p className="text-xxs text-slate-500 font-medium italic">Memo: {ronda.keterangan}</p>
                  )}

                  {/* Options to remove rota */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        if (confirm('Yakin mendelegasikan & menghapus jadwal Ronda ini?')) {
                          onRemoveRonda(ronda.id);
                        }
                      }}
                      className="absolute right-3.5 bottom-3.5 p-1 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-slate-100 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6 font-medium">Jadwal ronda kosong</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Agenda / Routine village agendas Column */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <Calendar className="w-4.5 h-4.5 text-emerald-600" />
              Agenda & Kegiatan Rutin Desa
            </h3>
            <button
              onClick={() => setShowKegiatanModal(true)}
              className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-xxs font-bold text-emerald-700 transition"
            >
              + Kegiatan Baru
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-5 leading-normal">Kegiatan gotong royong, posyandu rutin lansia, rapat musyawarah warga wajib dihadiri pengurus terkait.</p>

          <div className="space-y-4">
            {filteredKegiatanList.length > 0 ? (
              filteredKegiatanList.map((keg) => (
                <div key={keg.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xxs font-extrabold ${
                      keg.kategori === 'Kesehatan' ? 'bg-emerald-50 text-emerald-700' :
                      keg.kategori === 'Gotong Royong' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {keg.kategori}
                    </span>
                    <span className="text-xxs font-bold text-slate-500 inline-flex items-center gap-0.5">
                      <Clock className="w-3 h-3 text-slate-400" /> {keg.waktu}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm">{keg.nama}</h4>
                  <p className="text-xxs text-slate-500 mt-1 font-medium leading-relaxed">{keg.deskripsi}</p>
                  
                  <div className="flex gap-4 items-center mt-3 pt-2.5 border-t border-slate-200/50 text-xxs text-slate-450 font-bold">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {keg.lokasi}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5 text-slate-450" /> P.J: {keg.penanggungJawab}
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        if (confirm(`Yakin mendelegasikan & membatalkan agenda "${keg.nama}"?`)) {
                          onRemoveKegiatan(keg.id);
                        }
                      }}
                      className="absolute right-3.5 bottom-3.5 p-1 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-slate-100 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6 font-medium">Jadwal kegiatan kosong</p>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Ronda Form Modal */}
      {showRondaModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xxs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full max-h-[85vh] overflow-y-auto p-6">
            <h3 className="text-base font-bold text-slate-900 mb-3 border-none flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              Susun Jadwal Ronda Bergilir
            </h3>

            <form onSubmit={handleCreateRonda} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Pilih Hari Dinas</label>
                <select
                  value={rondaHari}
                  onChange={(e) => setRondaHari(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700"
                >
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                  <option value="Minggu">Minggu</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-2">Pilih Petugas (Klik untuk memilih)</label>
                <div className="max-h-40 overflow-y-auto space-y-1 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {wargaList.filter(w => w.status === 'Aktif' && w.jk === 'L' && (isAdmin || w.rwId === userRwId)).map(w => (
                    <div 
                      key={w.id} 
                      onClick={() => handleWargaSelectionToggle(w.id)}
                      className={`p-2 rounded-lg cursor-pointer flex justify-between items-center transition ${
                        rondaWargas.includes(w.id) ? 'bg-indigo-500 text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{w.nama} ({w.rwId})</span>
                      {rondaWargas.includes(w.id) && <span className="text-xxs bg-white/20 px-2 py-0.5 rounded">Terpilih</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Pos Kamling / Wilayah Lokasi</label>
                <input
                  type="text"
                  required
                  value={rondaSektor}
                  onChange={(e) => setRondaSektor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Mulai Dinas</label>
                  <input
                    type="text"
                    value={rondaJamMulai}
                    onChange={(e) => setRondaJamMulai(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Selesai Dinas</label>
                  <input
                    type="text"
                    value={rondaJamSelesai}
                    onChange={(e) => setRondaJamSelesai(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Catatan Tambahan (Sebutkan perbekalan)</label>
                <input
                  type="text"
                  value={rondaKet}
                  onChange={(e) => setRondaKet(e.target.value)}
                  placeholder="cth. Bawa obat nyamuk & jas hujan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 text-xxs font-bold">
                <button
                  type="button"
                  onClick={() => setShowRondaModal(false)}
                  className="px-4 py-2 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-650"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                >
                  Rilis Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kegiatan Form Modal */}
      {showKegiatanModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xxs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full max-h-[85vh] overflow-y-auto p-6">
            <h3 className="text-base font-bold text-slate-900 mb-3 border-none flex items-center gap-1">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Sutradara Rilis Kegiatan Desa
            </h3>

            <form onSubmit={handleCreateKegiatan} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Nama Agenda / Aktivitas</label>
                <input
                  type="text"
                  required
                  value={kegiatanNama}
                  onChange={(e) => setKegiatanNama(e.target.value)}
                  placeholder="cth. Imunisasi Posyandu Anggrek"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Kategori Agenda</label>
                <select
                  value={kegiatanKat}
                  onChange={(e) => setKegiatanKat(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="Kesehatan">Kesehatan (Posyandu, Penimbangan)</option>
                  <option value="Gotong Royong">Gotong Royong (Pembersihan, Kerja Bakti)</option>
                  <option value="Keagamaan">Keagamaan (Pengajian, Doa Bersama)</option>
                  <option value="Sosial">Sosial (Santunan, Ramah Tamah)</option>
                  <option value="Rapat / Musyawarah">Rapat / Musyawarah (Pertemuan Kelompok)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Frekuensi Pelaksanaan</label>
                <input
                  type="text"
                  required
                  value={kegiatanFrek}
                  onChange={(e) => setKegiatanFrekuensi(e.target.value)}
                  placeholder="cth. Setiap Kamis pertama sebulan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Lokasi Wilayah Kegiatan</label>
                <input
                  type="text"
                  required
                  value={kegiatanLok}
                  onChange={(e) => setKegiatanLokasi(e.target.value)}
                  placeholder="Balai Dusun Sukamaju"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Waktu Pelaksanaan</label>
                <input
                  type="text"
                  required
                  value={kegiatanWakt}
                  onChange={(e) => setKegiatanWaktu(e.target.value)}
                  placeholder="cth. 08:00 WIB - selesai"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Penanggung Jawab Giat (P.J)</label>
                <input
                  type="text"
                  required
                  value={kegiatanPj}
                  onChange={(e) => setKegiatanPenanggungJawab(e.target.value)}
                  placeholder="Ibu Selvi Aminah"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Maksud / Deskripsi Ringkas</label>
                <textarea
                  required
                  rows={3}
                  value={kegiatanDesk}
                  onChange={(e) => setKegiatanDeskripsi(e.target.value)}
                  placeholder="Tulis maksud diselenggarakannya giat warga tersebut..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 leading-normal"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 text-xxs font-bold">
                <button
                  type="button"
                  onClick={() => setShowKegiatanModal(false)}
                  className="px-4 py-2 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-650"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                >
                  Sebarkan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
