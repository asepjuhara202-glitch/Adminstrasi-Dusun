import React, { useState } from 'react';
import { Warga, RW, MutasiLog, User } from '../types';
import * as XLSX from 'xlsx';
import { Search, Plus, Filter, UserCheck, HeartCrack, ChevronLeft, ChevronRight, UserMinus, FileText, ArrowLeftRight, Users, Home, GraduationCap, Briefcase, Download, Upload, FileSpreadsheet, Camera, Trash2, User as UserIcon, Edit, Check, X, Database, FileJson, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  currentPhoto?: string;
  onPhotoUploaded: (base64: string) => void;
  onPhotoRemoved: () => void;
}

function CameraCapture({ currentPhoto, onPhotoUploaded, onPhotoRemoved }: CameraCaptureProps) {
  const [isActive, setIsActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const startVideo = async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 400, height: 400 }
      });
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsActive(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('Tidak dapat mengakses kamera. Pastikan izin kamera aktif.');
    }
  };

  const stopVideo = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setIsActive(false);
  };

  const capture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const vWidth = videoRef.current.videoWidth;
        const vHeight = videoRef.current.videoHeight;
        const size = Math.min(vWidth, vHeight);
        const sx = (vWidth - size) / 2;
        const sy = (vHeight - size) / 2;
        
        ctx.drawImage(videoRef.current, sx, sy, size, size, 0, 0, 400, 400);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onPhotoUploaded(dataUrl);
        stopVideo();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onPhotoUploaded(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  React.useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);

  return (
    <div className="flex flex-col items-center gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100/50">
      <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center group shadow-xxs">
        {isActive ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover scale-x-[-1]"
            playsInline
            muted
          />
        ) : currentPhoto ? (
          <img
            src={currentPhoto}
            referrerPolicy="no-referrer"
            alt="Foto Profil"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <UserIcon className="w-10 h-10 stroke-1" />
            <span className="text-[9px] uppercase font-bold tracking-wider mt-1 text-slate-400">Belum Ada Foto</span>
          </div>
        )}

        {isActive && (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-indigo-500/80 animate-bounce" />
        )}
      </div>

      <div className="flex gap-1.5 justify-center w-full">
        {isActive ? (
          <>
            <button
              type="button"
              onClick={capture}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Jepret
            </button>
            <button
              type="button"
              onClick={stopVideo}
              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Batal
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={startVideo}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1"
            >
              <Camera className="w-3.5 h-3.5" /> Kamera
            </button>
            <label className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition flex items-center gap-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Unggah
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {currentPhoto && (
              <button
                type="button"
                onClick={onPhotoRemoved}
                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                title="Hapus foto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}
      </div>
      {errorMsg && (
        <span className="text-[10px] text-rose-600 font-semibold">{errorMsg}</span>
      )}
    </div>
  );
}

interface WargaTabProps {
  currentUser: User | null;
  wargaList: Warga[];
  rwList: RW[];
  mutasiList: MutasiLog[];
  onAddWarga: (warga: Omit<Warga, 'id'>) => Promise<void>;
  onAddWargaBulk?: (newWargaList: Omit<Warga, 'id'>[]) => Promise<void>;
  onEditWarga: (id: number, edits: Partial<Warga>) => Promise<void>;
  onRemoveWarga: (id: number) => Promise<void>;
  onRemoveWargaBulk?: (ids: number[]) => Promise<void>;
  onRestoreWargaBackup?: (backupWargas: Warga[], mode: 'overwrite' | 'merge') => Promise<void>;
}

export function WargaTab({ 
  currentUser, 
  wargaList, 
  rwList, 
  mutasiList, 
  onAddWarga, 
  onAddWargaBulk,
  onEditWarga, 
  onRemoveWarga,
  onRemoveWargaBulk,
  onRestoreWargaBackup
}: WargaTabProps) {
  const [search, setSearch] = useState('');
  const [filterRw, setFilterRw] = useState(() => {
    return currentUser?.role === 'User' && currentUser?.rwId ? currentUser.rwId : 'ALL';
  });
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterRt, setFilterRt] = useState('ALL');
  const [filterPendidikan, setFilterPendidikan] = useState('ALL');
  const [filterPekerjaan, setFilterPekerjaan] = useState('ALL');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Keep filterRw in sync with the current user's role
  React.useEffect(() => {
    if (currentUser?.role === 'User' && currentUser?.rwId) {
      setFilterRw(currentUser.rwId);
    } else {
      setFilterRw('ALL');
    }
  }, [currentUser]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState<Warga | null>(null);
  const [showEditModal, setShowEditModal] = useState<Warga | null>(null);
  const [editFormData, setEditFormData] = useState<Warga | null>(null);

  // Backup and Restore States
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreFileContent, setRestoreFileContent] = useState<Warga[] | null>(null);
  const [restoreFileName, setRestoreFileName] = useState('');
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);

  const handleBackupJson = () => {
    try {
      const dataStr = JSON.stringify(wargaList, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `backup_data_warga_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor data cadangan JSON.');
    }
  };

  const handleRestoreJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          // Basic validation
          const isValid = parsed.every(item => item && typeof item === 'object' && 'nama' in item && 'nik' in item);
          if (isValid) {
            setRestoreFileContent(parsed);
            setShowRestoreModal(true);
          } else {
            alert('File JSON tidak valid. Format kependudukan warga harus memiliki atribut NIK dan Nama.');
          }
        } else {
          alert('Format data cadangan harus berupa array dari data warga.');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal membaca file JSON. Pastikan file dalam format JSON yang valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const executeRestore = async () => {
    if (!restoreFileContent || !onRestoreWargaBackup) return;
    setIsRestoring(true);
    try {
      await onRestoreWargaBackup(restoreFileContent, restoreMode);
      alert(`Berhasil memulihkan ${restoreFileContent.length} data warga dengan sukses!`);
      setShowRestoreModal(false);
      setRestoreFileContent(null);
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memulihkan data warga.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Reset selection and pagination when filters change
  React.useEffect(() => {
    setSelectedIds([]);
    setCurrentPage(1);
  }, [search, filterRw, filterStatus, filterRt, filterPendidikan, filterPekerjaan]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => {
        // Keep selected items from other pages, and add all items from the current page
        const otherIds = prev.filter(id => !paginatedWarga.some(pw => pw.id === id));
        return [...otherIds, ...paginatedWarga.map(w => w.id)];
      });
    } else {
      setSelectedIds(prev => prev.filter(id => !paginatedWarga.some(pw => pw.id === id)));
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus masal ${selectedIds.length} data warga yang terpilih?\n\nTindakan ini bersifat permanen dan tidak dapat dibatalkan.`)) {
      try {
        if (onRemoveWargaBulk) {
          await onRemoveWargaBulk(selectedIds);
        } else {
          for (const id of selectedIds) {
            await onRemoveWarga(id);
          }
        }
        setSelectedIds([]);
        alert('Berhasil menghapus masal data warga terpilih!');
      } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan saat menghapus sebagian data warga!');
      }
    }
  };
  
  // Warga Form State
  const [formData, setFormData] = useState({
    nik: '',
    kk: '',
    nama: '',
    tempatLahir: '',
    tanggalLahir: '',
    jk: 'L' as 'L' | 'P',
    agama: 'Islam',
    pendidikan: 'SMA',
    pekerjaan: 'Wiraswasta',
    golonganDarah: '-',
    rt: '',
    hubungan: 'Kepala Keluarga',
    alamat: '',
    kontak: '',
    rwId: currentUser?.rwId || 'RW 01',
    status: 'Aktif' as Warga['status'],
    foto: '',
    catatan: ''
  });

  // Permissions gate
  const userRwId = currentUser?.rwId;
  const isAdmin = currentUser?.role === 'Admin';
  const canManage = isAdmin || currentUser?.role === 'User';
  
  // Extract unique sorted list of RT, Pendidikan, and Pekerjaan for dropdown options
  const uniqueRts = Array.from(new Set(wargaList.map(w => w.rt).filter(Boolean))).sort() as string[];
  const uniquePendidikan = Array.from(new Set(wargaList.map(w => w.pendidikan).filter(Boolean))).sort() as string[];
  const uniquePekerjaan = Array.from(new Set(wargaList.map(w => w.pekerjaan).filter(Boolean))).sort() as string[];

  // Filtered lists
  const filteredWarga = wargaList.filter(w => {
    const matchesSearch = w.nama.toLowerCase().includes(search.toLowerCase()) || 
                          w.nik.includes(search) || 
                          w.kk.includes(search);
    const matchesRw = filterRw === 'ALL' || w.rwId === filterRw;
    const matchesStatus = filterStatus === 'ALL' || w.status === filterStatus;
    const matchesRt = filterRt === 'ALL' || w.rt === filterRt;
    const matchesPendidikan = filterPendidikan === 'ALL' || w.pendidikan === filterPendidikan;
    const matchesPekerjaan = filterPekerjaan === 'ALL' || w.pekerjaan === filterPekerjaan;
    
    // Restriction: Non-admin can only see/access their own RW or general basic profiles.
    if (!isAdmin && w.rwId !== userRwId) return false;
    
    return matchesSearch && matchesRw && matchesStatus && matchesRt && matchesPendidikan && matchesPekerjaan;
  });

  const totalPages = Math.ceil(filteredWarga.length / pageSize) || 1;
  const paginatedWarga = filteredWarga.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeMutasi = mutasiList.filter(m => {
    if (isAdmin) return true;
    // Non-admin sees logs related to their own residents / matched wargaId
    const citizen = wargaList.find(w => w.id === m.wargaId);
    return citizen?.rwId === userRwId;
  });

  // Statistics
  const totalWarga = filteredWarga.length;
  const lakiLaki = filteredWarga.filter(w => w.jk === 'L').length;
  const perempuan = filteredWarga.filter(w => w.jk === 'P').length;
  const aktifCount = filteredWarga.filter(w => w.status === 'Aktif').length;
  const uniqueKkCount = Array.from(new Set(filteredWarga.map(w => w.kk).filter(Boolean))).length;

  const canEditWarga = (warga: Warga) => {
    if (isAdmin) return true;
    return userRwId === warga.rwId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nik || !formData.nama || !formData.kk) {
      alert('NIK, KK, dan Nama wajib diisi!');
      return;
    }
    
    const finalRwId = !isAdmin && userRwId ? userRwId : formData.rwId;
    await onAddWarga({
      ...formData,
      rwId: finalRwId,
      tanggalInput: new Date().toISOString().split('T')[0]
    });
    
    setShowAddModal(false);
    // Reset Form
    setFormData({
      nik: '',
      kk: '',
      nama: '',
      tempatLahir: '',
      tanggalLahir: '',
      jk: 'L',
      agama: 'Islam',
      pendidikan: 'SMA',
      pekerjaan: 'Wiraswasta',
      golonganDarah: '-',
      rt: '',
      hubungan: 'Kepala Keluarga',
      alamat: '',
      kontak: '',
      rwId: currentUser?.rwId || 'RW 01',
      status: 'Aktif',
      foto: '',
      catatan: ''
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    if (!editFormData.nik || !editFormData.nama || !editFormData.kk) {
      alert('NIK, KK, dan Nama wajib diisi!');
      return;
    }

    const finalEdits = !isAdmin && userRwId ? { ...editFormData, rwId: userRwId } : editFormData;
    await onEditWarga(editFormData.id, finalEdits);
    setShowEditModal(null);
    setEditFormData(null);
  };

  const handleExportExcel = () => {
    try {
      const dataToExport = filteredWarga.map((w, index) => ({
        'No': index + 1,
        'NIK': w.nik,
        'No. KK': w.kk,
        'Nama': w.nama,
        'Hubungan Keluarga': w.hubungan,
        'Jenis Kelamin (L/P)': w.jk,
        'Tempat Lahir': w.tempatLahir,
        'Tanggal Lahir': w.tanggalLahir,
        'Agama': w.agama,
        'Pendidikan': w.pendidikan,
        'Pekerjaan': w.pekerjaan,
        'RT': w.rt || '',
        'RW': w.rwId,
        'Golongan Darah': w.golonganDarah || '-',
        'Alamat': w.alamat || '',
        'Kontak': w.kontak || '',
        'Status': w.status,
        'Tanggal Input': w.tanggalInput || '',
        'Catatan': w.catatan || ''
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(wb, ws, 'Data Penduduk');
      
      // Auto-size columns slightly
      const colWidths = Object.keys(dataToExport[0] || {}).map(key => ({
        wch: Math.max(key.length + 2, 10)
      }));
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `DATA_PENDUDUK_DUSUN III_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
      console.error('Gagal mengekspor file Excel:', e);
      alert('Terjadi kesalahan saat mengekspor data kependudukan!');
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      alert('Maaf, hanya Kepala Dusun (Admin) yang memiliki hak akses untuk mengimpor data kependudukan via Excel.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        // Read file contents
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Parse raw rows
        const rawRows = XLSX.utils.sheet_to_json(ws) as any[];
        
        if (rawRows.length === 0) {
          alert('File Excel kosong atau tidak terbaca!');
          return;
        }

        const validWargas: Omit<Warga, 'id'>[] = [];
        
        for (const row of rawRows) {
          // Flexible headers mapping
          const nama = row['Nama'] || row['Nama Lengkap'] || row['Name'] || row['nama'] || '';
          const nikRaw = row['NIK'] || row['Nomor Induk Kependudukan'] || row['nik'] || '';
          const kkRaw = row['No. KK'] || row['KK'] || row['Kartu Keluarga'] || row['No KK'] || row['kk'] || '';
          
          if (!nama) continue; // Nama is strictly required
          
          const nik = String(nikRaw).replace(/[^0-9]/g, '');
          const kk = String(kkRaw).replace(/[^0-9]/g, '');

          if (!nik || !kk) {
            console.warn(`Baris dilewati karena NIK atau KK tidak valid/kosong untuk nama: ${nama}`);
            continue;
          }

          // Sex parsing
          const rawJk = String(row['Jenis Kelamin (L/P)'] || row['JK'] || row['Jenis Kelamin'] || row['jk'] || 'L').trim().toUpperCase();
          const jk = rawJk.startsWith('P') || rawJk === 'PEREMPUAN' || rawJk === 'FEMALE' ? 'P' : 'L';

          // RT cleaning & validation (ex: "3" -> "03", "02" -> "02")
          let rtRaw = String(row['RT'] || row['rt'] || '').trim().replace(/[^0-9]/g, '');
          const rt = rtRaw ? rtRaw.padStart(2, '0').slice(-3) : '';

          // RW mapping
          let rwId = '';
          if (!isAdmin && userRwId) {
            rwId = userRwId;
          } else {
            const tempRw = row['RW'] || row['rwId'] || row['RW Sektor'] || row['rw'] || 'RW 07';
            if (typeof tempRw === 'number' || !isNaN(Number(tempRw))) {
              rwId = `RW ${String(tempRw).padStart(2, '0')}`;
            } else {
              const cleanRwMatch = String(tempRw).trim().toUpperCase();
              if (cleanRwMatch.startsWith('RW')) {
                rwId = cleanRwMatch;
              } else {
                rwId = `RW ${cleanRwMatch.padStart(2, '0')}`;
              }
            }
          }

          validWargas.push({
            nik,
            kk,
            nama: String(nama).trim(),
            tempatLahir: String(row['Tempat Lahir'] || row['tempatLahir'] || row['Tempat_Lahir'] || '-').trim(),
            tanggalLahir: String(row['Tanggal Lahir'] || row['tanggalLahir'] || row['Tanggal_Lahir'] || '1990-01-01').trim(),
            jk,
            agama: String(row['Agama'] || row['agama'] || 'Islam').trim(),
            pendidikan: String(row['Pendidikan'] || row['pendidikan'] || 'SMA').trim(),
            pekerjaan: String(row['Pekerjaan'] || row['pekerjaan'] || 'Wiraswasta').trim(),
            golonganDarah: String(row['Golongan Darah'] || row['golonganDarah'] || row['Gol. Darah'] || '-').trim().toUpperCase(),
            rt,
            rwId,
            hubungan: String(row['Hubungan Keluarga'] || row['Hubungan'] || row['hubungan'] || 'Anggota Keluarga').trim(),
            alamat: String(row['Alamat'] || row['alamat'] || '').trim(),
            kontak: String(row['Kontak'] || row['No. HP'] || row['kontak'] || row['Kontak HP'] || '').trim(),
            status: (row['Status'] || row['status'] || 'Aktif') as Warga['status'],
            catatan: String(row['Catatan'] || row['catatan'] || '').trim(),
            tanggalInput: new Date().toISOString().split('T')[0]
          });
        }

        if (validWargas.length === 0) {
          alert('Tidak ditemukan baris yang memenuhi syarat wajib! Pastikan file Excel berisi kolom: Nama, NIK, dan No. KK.');
          return;
        }

        if (confirm(`Sistem mendeteksi ${validWargas.length} data penduduk valid siap dimasukkan. Lanjut mengimpor ke database?`)) {
          if (onAddWargaBulk) {
            await onAddWargaBulk(validWargas);
          } else {
            for (const item of validWargas) {
              await onAddWarga(item);
            }
          }
          alert(`Berhasil mengimpor ${validWargas.length} data kependudukan baru.`);
        }
      } catch (err) {
        console.error('Ada masalah ketika menguraikan file Excel:', err);
        alert('Gagal mengurai file Excel. Silakan periksa kembali kecocokan format baris kependudukan.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div id="stats-total-penduduk" className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Penduduk</span>
          <span className="text-3xl font-bold text-slate-800">{totalWarga}</span>
          <span className="text-xs text-slate-500 mt-2 font-medium">Jiwa terdata</span>
        </div>
        <div id="stats-jumlah-kk" className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Jumlah KK</span>
          <span className="text-3xl font-bold text-indigo-600">{uniqueKkCount}</span>
          <span className="text-xs text-slate-500 mt-2 font-medium">Kepala Keluarga</span>
        </div>
        <div id="stats-laki-laki" className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Laki-Laki</span>
          <span className="text-3xl font-bold text-indigo-600">{lakiLaki}</span>
          <span className="text-xs text-slate-500 mt-2 font-medium">Jiwa terfilter</span>
        </div>
        <div id="stats-perempuan" className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Perempuan</span>
          <span className="text-3xl font-bold text-pink-600">{perempuan}</span>
          <span className="text-xs text-slate-500 mt-2 font-medium">Jiwa terfilter</span>
        </div>
        <div id="stats-penduduk-aktif" className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Penduduk Aktif</span>
          <span className="text-3xl font-bold text-emerald-600">{aktifCount}</span>
          <span className="text-xs text-slate-505 mt-2 font-medium">Jiwa menetap aktif</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Nama, NIK, atau KK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">
          {/* RW filter dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterRw}
              onChange={(e) => setFilterRw(e.target.value)}
              disabled={!isAdmin}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer disabled:opacity-75"
            >
              {isAdmin ? (
                <>
                  <option value="ALL">Semua RW</option>
                  {rwList.map(rw => (
                    <option key={rw.id} value={rw.id}>{rw.id}</option>
                  ))}
                </>
              ) : (
                <option value={userRwId}>{userRwId}</option>
              )}
            </select>
          </div>

          {/* Status filter dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-xl">
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Meninggal">Meninggal</option>
              <option value="Pindah">Pindah</option>
              <option value="Sementara">Penduduk Sementara</option>
            </select>
          </div>

          {/* RT filter dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-xl">
            <Home className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterRt}
              onChange={(e) => setFilterRt(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua RT</option>
              {uniqueRts.map(rt => (
                <option key={rt} value={rt}>RT {rt}</option>
              ))}
            </select>
          </div>

          {/* Pendidikan filter dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-xl">
            <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterPendidikan}
              onChange={(e) => setFilterPendidikan(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Pendidikan</option>
              {uniquePendidikan.map(edu => (
                <option key={edu} value={edu}>{edu}</option>
              ))}
            </select>
          </div>

          {/* Pekerjaan filter dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-xl">
            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterPekerjaan}
              onChange={(e) => setFilterPekerjaan(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Pekerjaan</option>
              {uniquePekerjaan.map(job => (
                <option key={job} value={job}>{job}</option>
              ))}
            </select>
          </div>

          {/* Import Excel */}
          {isAdmin && (
            <label className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-emerald-200/50 shadow-xxs transition cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Excel</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleImportExcel}
                className="hidden"
              />
            </label>
          )}

          {/* Backup & Restore JSON (Admin Only) */}
          {isAdmin && (
            <>
              <button
                onClick={handleBackupJson}
                className="inline-flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-indigo-200/50 shadow-xxs transition cursor-pointer"
                title="Cadangkan seluruh data warga ke file JSON"
              >
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                Backup JSON
              </button>

              <label className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-amber-200/50 shadow-xxs transition cursor-pointer" title="Pulihkan data warga dari file JSON cadangan">
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                <span>Restore JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreJsonUpload}
                  className="hidden"
                />
              </label>
            </>
          )}

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-200 shadow-xxs transition cursor-pointer"
            title="Ekspor daftar penduduk terfilter ke Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Excel
          </button>

          {/* Add resident button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Tambah Warga
          </button>
        </div>
      </div>

      {/* Bulk actions bar if selectedIds has any items */}
      {canManage && selectedIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800">
              Terpilih <span className="text-rose-600 font-extrabold">{selectedIds.length}</span> warga untuk tindakan masal
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedIds([])}
              className="w-full sm:w-auto text-xs font-bold text-slate-600 hover:text-slate-850 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xxs transition shrink-0 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleBulkDelete}
              className="w-full sm:w-auto text-xs font-bold text-white px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition shrink-0 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Masal ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Main Citizens Table Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                {canManage && (
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={paginatedWarga.length > 0 && paginatedWarga.every(w => selectedIds.includes(w.id))}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-550 w-4 h-4 cursor-pointer"
                    />
                  </th>
                )}
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Warga</th>
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">KK & NIK</th>
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">RW</th>
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">RT</th>
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pendidikan</th>
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pekerjaan</th>
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Agama</th>
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gol. Darah</th>
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kontak</th>
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedWarga.length > 0 ? (
                paginatedWarga.map((warga) => (
                  <tr key={warga.id} className="hover:bg-slate-50/40 transition">
                    {canManage && (
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(warga.id)}
                          onChange={(e) => handleSelectOne(warga.id, e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 shadow-xxs">
                          {warga.foto ? (
                            <img src={warga.foto} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-xs font-bold text-indigo-650">{warga.nama.substring(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 border-none">{warga.nama}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{warga.hubungan} • {warga.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-mono text-xs text-slate-600 font-medium">KK: {warga.kk}</p>
                        <p className="font-mono text-xs text-slate-400 mt-0.5">NIK: {warga.nik}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-sm font-semibold text-slate-600">{warga.rwId}</td>
                    <td className="py-3.5 px-4 text-sm font-semibold text-slate-600">{warga.rt ? `RT ${warga.rt}` : '-'}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{warga.pendidikan || '-'}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{warga.pekerjaan || '-'}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{warga.agama || '-'}</td>
                    <td className="py-3.5 px-4 text-xs font-bold text-rose-600">{warga.golonganDarah || '-'}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{warga.kontak || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        warga.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' :
                        warga.status === 'Meninggal' ? 'bg-rose-50 text-red-700' :
                        warga.status === 'Pindah' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {warga.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end items-center gap-2.5">
                        <button
                          onClick={() => setShowDetailsModal(warga)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-650 hover:text-indigo-805 transition cursor-pointer"
                        >
                          Detail <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        {canEditWarga(warga) && (
                          <button
                            onClick={() => {
                              setShowEditModal(warga);
                              setEditFormData({ ...warga });
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-800 transition cursor-pointer"
                            title="Ubah data penduduk"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        )}
                        {canManage && (
                          <button
                            onClick={async () => {
                              if (confirm(`Apakah Anda yakin ingin menghapus data warga "${warga.nama}" secara permanen?`)) {
                                try {
                                  await onRemoveWarga(warga.id);
                                  setSelectedIds(prev => prev.filter(id => id !== warga.id));
                                } catch (e) {
                                  alert('Gagal menghapus data warga!');
                                }
                              }
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-rose-650 hover:text-rose-800 transition cursor-pointer"
                            title="Hapus data warga secara permanen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canManage ? 12 : 11} className="text-center py-10 flex-cell">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Users className="w-10 h-10 mb-2 stroke-1" />
                      <p className="font-semibold text-sm">Tidak Ada Data Warga Ditemukan</p>
                      <p className="text-xs mt-1">Coba sesuaikan pencarian atau tambahkan warga baru.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredWarga.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/40 dark:bg-slate-900/40">
            {/* Rows Per Page Limit Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Batasi Baris:</span>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                {[10, 50, 100].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                      pageSize === size
                        ? 'bg-white dark:bg-slate-700 text-indigo-650 dark:text-indigo-400 shadow-xxs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Pagination Range Info */}
            <div className="text-xs text-slate-500 font-medium order-3 md:order-2">
              Menampilkan <span className="font-bold text-slate-700 dark:text-slate-300">{Math.min(filteredWarga.length, (currentPage - 1) * pageSize + 1)}</span>
              {' - '}
              <span className="font-bold text-slate-700 dark:text-slate-300">{Math.min(currentPage * pageSize, filteredWarga.length)}</span> dari{' '}
              <span className="font-bold text-slate-700 dark:text-slate-300">{filteredWarga.length}</span> Warga
            </div>

            {/* Page navigation controls */}
            <div className="flex items-center gap-2.5 order-2 md:order-3">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-xxs"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Halaman</span>
                <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-indigo-650 dark:text-indigo-400 font-mono shadow-xxs">
                  {currentPage} / {totalPages}
                </span>
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-xxs"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mutasi Logs Sub-Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100">
        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-4">
          <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
          Log Mutasi & Dinamika Penduduk
        </h3>
        <p className="text-xs text-slate-500 mb-4">Perubahan status menetap, pelaporan kelahiran, kematian, dan peristiwa kependudukan di RW secara seketika.</p>

        <div className="space-y-3">
          {activeMutasi.length > 0 ? (
            activeMutasi.map((log) => (
              <div key={log.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3 justify-between">
                <div className="flex gap-2.5">
                  <div className={`p-1.5 rounded-lg mt-0.5 ${
                    log.jenis === 'Lahir' ? 'bg-emerald-50 text-emerald-600' :
                    log.jenis === 'Meninggal' ? 'bg-red-50 text-red-650' : 'bg-indigo-50/70 text-indigo-600'
                  }`}>
                    {log.jenis === 'Meninggal' ? <HeartCrack className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{log.namaWarga} - <span className="font-normal text-slate-500 font-mono text-xs">{log.nik}</span></p>
                    <p className="text-xs font-semibold text-indigo-600 mt-1">{log.jenis} • <span className="font-normal text-slate-500">{log.keterangan}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Dilapor Oleh</p>
                  <p className="text-xs font-semibold text-slate-600">{log.petugasName}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">Belum ada peristiwa mutasi penduduk terekam</p>
          )}
        </div>
      </div>

      {/* Add Warga Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xxs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-900 border-none mb-4">Pendaftaran Warga Baru</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center justify-center p-2 mb-2">
                <label className="block text-xs font-bold text-slate-600 mb-2.5 text-center uppercase tracking-wide">Foto Profil Warga</label>
                <CameraCapture
                  currentPhoto={formData.foto}
                  onPhotoUploaded={(base64) => setFormData({ ...formData, foto: base64 })}
                  onPhotoRemoved={() => setFormData({ ...formData, foto: '' })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nomor Induk Kependudukan (NIK)</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                    placeholder="cth. 3204xxxxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nomor Kartu Keluarga (KK)</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={formData.kk}
                    onChange={(e) => setFormData({ ...formData, kk: e.target.value.replace(/\D/g, '') })}
                    placeholder="cth. 3204xxxxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nama Lengkap Warga</label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="cth. Budi Santoso"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.jk}
                    onChange={(e) => setFormData({ ...formData, jk: e.target.value as 'L' | 'P' })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={formData.tempatLahir}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    placeholder="cth. Bandung"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Lahir</label>
                  <input
                    type="text"
                    value={formData.tanggalLahir}
                    onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                    placeholder="cth. 12 April 1990"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Hubungan Keluarga</label>
                  <select
                    value={formData.hubungan}
                    onChange={(e) => setFormData({ ...formData, hubungan: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Kepala Keluarga">Kepala Keluarga</option>
                    <option value="Suami">Suami</option>
                    <option value="Istri">Istri</option>
                    <option value="Anak">Anak</option>
                    <option value="Orang Tua">Orang Tua</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nomor Kontak (WhatsApp)</label>
                  <input
                    type="text"
                    value={formData.kontak}
                    onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                    placeholder="cth. 0812-xxxx-xxxx"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Wilayah RW</label>
                  <select
                    disabled={!isAdmin && userRwId != null}
                    value={formData.rwId}
                    onChange={(e) => setFormData({ ...formData, rwId: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    {rwList.map(rw => (
                      <option key={rw.id} value={rw.id}>{rw.id} - Kelolaan {rw.wilayah}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Status Keaktifan</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Sementara">Sementara</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Rukun Tetangga (RT)</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={formData.rt}
                    onChange={(e) => setFormData({ ...formData, rt: e.target.value.replace(/\D/g, '') })}
                    placeholder="cth. 03"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Golongan Darah</label>
                  <select
                    value={formData.golonganDarah}
                    onChange={(e) => setFormData({ ...formData, golonganDarah: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="-">-</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Agama</label>
                  <select
                    value={formData.agama}
                    onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen Protestan">Kristen Protestan</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Khonghucu">Khonghucu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Pendidikan Terakhir</label>
                  <select
                    value={formData.pendidikan}
                    onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Tidak/Belum Sekolah">Tidak/Belum Sekolah</option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                    <option value="Diploma">Diploma</option>
                    <option value="D1">D1</option>
                    <option value="D2">D2</option>
                    <option value="D3">D3</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Pekerjaan</label>
                  <input
                    type="text"
                    value={formData.pekerjaan}
                    onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                    placeholder="cth. Wiraswasta"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Alamat Penjelas</label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Isi alamat persis warga"
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-xs font-semibold"
                >
                  Daftarkan Penduduk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xxs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-900 border-none">Profil Penduduk Terinci</h3>
              <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${
                showDetailsModal.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' :
                showDetailsModal.status === 'Meninggal' ? 'bg-rose-50 text-red-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {showDetailsModal.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-250 border border-slate-200 flex items-center justify-center shrink-0 shadow-xxs">
                  {showDetailsModal.foto ? (
                    <img src={showDetailsModal.foto} alt={showDetailsModal.nama} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-slate-400 stroke-1" />
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-bold text-base text-slate-900">{showDetailsModal.nama}</h4>
                  <p className="text-xs font-semibold text-indigo-650 mt-0.5">{showDetailsModal.hubungan} • {showDetailsModal.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                  <p className="text-xxs text-slate-400 mt-1 font-mono">ID Penduduk: #{showDetailsModal.id}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Nama Lengkap</span>
                  <span className="font-bold text-slate-800">{showDetailsModal.nama}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">NIK Warga</span>
                  <span className="font-mono text-slate-700">{showDetailsModal.nik}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">No. Kartu Keluarga</span>
                  <span className="font-mono text-slate-700">{showDetailsModal.kk}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Wilayah RW & RT</span>
                  <span className="font-semibold text-slate-700">{showDetailsModal.rwId} / RT {showDetailsModal.rt || '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Tempat, Tgl Lahir</span>
                  <span className="text-slate-700">{showDetailsModal.tempatLahir || '-'}, {showDetailsModal.tanggalLahir || '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Agama</span>
                  <span className="text-slate-700 font-medium">{showDetailsModal.agama || '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Pendidikan Terakhir</span>
                  <span className="text-slate-700 font-medium">{showDetailsModal.pendidikan || '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Golongan Darah</span>
                  <span className="text-rose-600 font-bold">{showDetailsModal.golonganDarah || '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Pekerjaan & Hubungan</span>
                  <span className="text-slate-700">{showDetailsModal.pekerjaan || '-'} ({showDetailsModal.hubungan})</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Kontak HP</span>
                  <span className="font-mono text-slate-700">{showDetailsModal.kontak || '-'}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Alamat Domisili</p>
                <p className="text-xs text-slate-700 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">{showDetailsModal.alamat || 'Alamat tidak terinci.'}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500">Ubah Status Demografi (Mutasi)</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={showDetailsModal.status === 'Aktif'}
                    onClick={() => {
                      onEditWarga(showDetailsModal.id, { status: 'Aktif' });
                      setShowDetailsModal(null);
                    }}
                    className="flex-grow py-2 px-3 border border-slate-100 text-xs font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-300 transition cursor-pointer"
                  >
                    Kembali Aktif
                  </button>
                  <button
                    disabled={showDetailsModal.status === 'Meninggal'}
                    onClick={() => {
                      if (confirm(`Yakin mendaftarkan peristiwa kematian untuk ${showDetailsModal.nama}?`)) {
                        onEditWarga(showDetailsModal.id, { status: 'Meninggal' });
                        setShowDetailsModal(null);
                      }
                    }}
                    className="flex-grow py-2 px-3 bg-red-50 hover:bg-red-100 text-red-650 text-xs font-bold rounded-xl transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HeartCrack className="w-3.5 h-3.5" />
                    Wafat (Meninggal)
                  </button>
                  <button
                    disabled={showDetailsModal.status === 'Pindah'}
                    onClick={() => {
                      if (confirm(`Nyatakan pindah keluar domisili untuk ${showDetailsModal.nama}?`)) {
                        onEditWarga(showDetailsModal.id, { status: 'Pindah' });
                        setShowDetailsModal(null);
                      }
                    }}
                    className="flex-grow py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    Pindah Keluar
                  </button>
                </div>
              </div>

              {canEditWarga(showDetailsModal) && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <button
                    onClick={() => {
                      const temp = showDetailsModal;
                      setShowDetailsModal(null);
                      setShowEditModal(temp);
                      setEditFormData({ ...temp });
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Ubah (Edit) Profil Warga
                  </button>
                </div>
              )}

              {canManage && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (confirm(`Hapus permanen berkas data dari ${showDetailsModal.nama}? Tindakan ini tidak dapat dibatalkan.`)) {
                        onRemoveWarga(showDetailsModal.id);
                        setShowDetailsModal(null);
                      }
                    }}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Hapus Data Warga
                  </button>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowDetailsModal(null)}
                  className="px-4 py-2 border border-slate-100 text-xs font-semibold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Tutup Berkas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Warga Modal */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xxs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-900 border-none mb-4">Ubah Data Profil Warga</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="flex flex-col items-center justify-center p-2 mb-2">
                <label className="block text-xs font-bold text-slate-600 mb-2.5 text-center uppercase tracking-wide">Foto Profil Warga</label>
                <CameraCapture
                  currentPhoto={editFormData.foto}
                  onPhotoUploaded={(base64) => setEditFormData({ ...editFormData, foto: base64 })}
                  onPhotoRemoved={() => setEditFormData({ ...editFormData, foto: '' })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nomor Induk Kependudukan (NIK)</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={editFormData.nik}
                    onChange={(e) => setEditFormData({ ...editFormData, nik: e.target.value.replace(/\D/g, '') })}
                    placeholder="cth. 3204xxxxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nomor Kartu Keluarga (KK)</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={editFormData.kk}
                    onChange={(e) => setEditFormData({ ...editFormData, kk: e.target.value.replace(/\D/g, '') })}
                    placeholder="cth. 3204xxxxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nama Lengkap Warga</label>
                  <input
                    type="text"
                    required
                    value={editFormData.nama}
                    onChange={(e) => setEditFormData({ ...editFormData, nama: e.target.value })}
                    placeholder="cth. Budi Santoso"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Jenis Kelamin</label>
                  <select
                    value={editFormData.jk}
                    onChange={(e) => setEditFormData({ ...editFormData, jk: e.target.value as 'L' | 'P' })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={editFormData.tempatLahir || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, tempatLahir: e.target.value })}
                    placeholder="cth. Bandung"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Lahir</label>
                  <input
                    type="text"
                    value={editFormData.tanggalLahir || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, tanggalLahir: e.target.value })}
                    placeholder="cth. 12 April 1990"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Hubungan Keluarga</label>
                  <select
                    value={editFormData.hubungan || 'Kepala Keluarga'}
                    onChange={(e) => setEditFormData({ ...editFormData, hubungan: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Kepala Keluarga">Kepala Keluarga</option>
                    <option value="Suami">Suami</option>
                    <option value="Istri">Istri</option>
                    <option value="Anak">Anak</option>
                    <option value="Orang Tua">Orang Tua</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nomor Kontak (WhatsApp)</label>
                  <input
                    type="text"
                    value={editFormData.kontak || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, kontak: e.target.value })}
                    placeholder="cth. 0812-xxxx-xxxx"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Wilayah RW</label>
                  <select
                    disabled={!isAdmin && userRwId != null}
                    value={editFormData.rwId}
                    onChange={(e) => setEditFormData({ ...editFormData, rwId: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    {rwList.map(rw => (
                      <option key={rw.id} value={rw.id}>{rw.id} - Kelolaan {rw.wilayah}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Status Keaktifan</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Sementara">Sementara</option>
                    <option value="Meninggal">Meninggal</option>
                    <option value="Pindah">Pindah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Rukun Tetangga (RT)</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={editFormData.rt || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, rt: e.target.value.replace(/\D/g, '') })}
                    placeholder="cth. 03"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Golongan Darah</label>
                  <select
                    value={editFormData.golonganDarah || '-'}
                    onChange={(e) => setEditFormData({ ...editFormData, golonganDarah: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="-">-</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Agama</label>
                  <select
                    value={editFormData.agama || 'Islam'}
                    onChange={(e) => setEditFormData({ ...editFormData, agama: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen Protestan">Kristen Protestan</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Khonghucu">Khonghucu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Pendidikan Terakhir</label>
                  <select
                    value={editFormData.pendidikan || 'SMA'}
                    onChange={(e) => setEditFormData({ ...editFormData, pendidikan: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Tidak/Belum Sekolah">Tidak/Belum Sekolah</option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                    <option value="Diploma">Diploma</option>
                    <option value="D1">D1</option>
                    <option value="D2">D2</option>
                    <option value="D3">D3</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Pekerjaan</label>
                  <input
                    type="text"
                    value={editFormData.pekerjaan || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, pekerjaan: e.target.value })}
                    placeholder="cth. Wiraswasta"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Alamat Penjelas</label>
                <textarea
                  value={editFormData.alamat || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, alamat: e.target.value })}
                  placeholder="Isi alamat persis warga"
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Catatan Kependudukan</label>
                <textarea
                  value={editFormData.catatan || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, catatan: e.target.value })}
                  placeholder="Isi catatan penting untuk warga ini jika ada..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(null);
                    setEditFormData(null);
                  }}
                  className="px-4 py-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-750 transition text-xs font-semibold cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restore JSON Modal */}
      {showRestoreModal && restoreFileContent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xxs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <Database className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Pulihkan Cadangan Data (JSON)</h3>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Anda mengunggah file cadangan data warga. Silakan konfirmasi opsi pemulihan di bawah ini untuk memperbarui pangkalan data kependudukan.
            </p>

            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-2.5 mb-5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium font-sans">Nama File:</span>
                <span className="text-slate-700 font-semibold font-mono truncate max-w-[240px]">{restoreFileName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium font-sans">Total Data Warga Cadangan:</span>
                <span className="text-slate-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-sm">{restoreFileContent.length} Jiwa</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Pilih Metode Pemulihan (Opsi)</label>
              
              <div className="grid grid-cols-1 gap-3">
                {/* Mode Merge */}
                <label className={`block p-3.5 rounded-xl border transition cursor-pointer ${restoreMode === 'merge' ? 'bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-500/10' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="restoreMode"
                      value="merge"
                      checked={restoreMode === 'merge'}
                      onChange={() => setRestoreMode('merge')}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-800 font-sans">Gabungkan Data (Merge) - DIREKOMENDASIKAN</span>
                      <span className="block text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Menambahkan data baru dari file cadangan. Sistem otomatis melewati data warga dengan NIK yang sudah ada untuk menghindari duplikasi kependudukan.
                      </span>
                    </div>
                  </div>
                </label>

                {/* Mode Overwrite */}
                <label className={`block p-3.5 rounded-xl border transition cursor-pointer ${restoreMode === 'overwrite' ? 'bg-rose-50/40 border-rose-200 ring-2 ring-rose-500/10' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="restoreMode"
                      value="overwrite"
                      checked={restoreMode === 'overwrite'}
                      onChange={() => setRestoreMode('overwrite')}
                      className="mt-1 h-4 w-4 text-rose-600 focus:ring-rose-500 border-slate-300"
                    />
                    <div>
                      <span className="block text-xs font-bold text-rose-800 font-sans">Kosongkan & Timpa (Overwrite) - BAHAYA!</span>
                      <span className="block text-[11px] text-rose-500 mt-1 leading-relaxed">
                        Menghapus <strong className="text-rose-600 font-extrabold">seluruh data warga saat ini</strong> dan menggantinya sepenuhnya dengan data dari berkas cadangan ini.
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {restoreMode === 'overwrite' && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl mb-6 text-xs text-rose-700 leading-relaxed font-medium">
                Peringatan: Seluruh data warga berstatus aktif, mutasi, dan pendaftaran kependudukan saat ini akan ditimpa bersih. Tindakan ini tidak dapat dibatalkan.
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestoreFileContent(null);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={executeRestore}
                className={`px-5 py-2.5 text-white rounded-xl transition text-xs font-semibold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 ${restoreMode === 'overwrite' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-650 hover:bg-indigo-700'}`}
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Memulihkan...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Mulai Pulihkan Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
