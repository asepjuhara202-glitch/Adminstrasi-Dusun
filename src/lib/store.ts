import { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from './firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc
} from 'firebase/firestore';
import { 
  Warga, 
  RW, 
  Iuran, 
  TransaksiIuran, 
  Pengajuan, 
  Laporan, 
  JadwalRonda, 
  KegiatanRutin, 
  MutasiLog,
  User,
  PenerimaBantuan,
  GalleryPhoto
} from '../types';
import { 
  INITIAL_WARGA, 
  INITIAL_RWS, 
  INITIAL_IURAN, 
  INITIAL_TRANSAKSI, 
  INITIAL_PENGAJUAN, 
  INITIAL_LAPORAN, 
  INITIAL_RONDA, 
  INITIAL_KEGIATAN, 
  INITIAL_MUTASI,
  INITIAL_PENERIMA,
  INITIAL_PHOTOS
} from './mockData';

export function useDusunStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('dusun_user');
    return saved ? JSON.parse(saved) : { id: 'admin', username: 'admin', nama: 'Ibu Kades Rahma', role: 'Admin' };
  });

  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [rwList, setRwList] = useState<RW[]>([]);
  const [iuranList, setIuranList] = useState<Iuran[]>([]);
  const [transaksiList, setTransaksiList] = useState<TransaksiIuran[]>([]);
  const [pengajuanList, setPengajuanList] = useState<Pengajuan[]>([]);
  const [laporanList, setLaporanList] = useState<Laporan[]>([]);
  const [rondaList, setRondaList] = useState<JadwalRonda[]>([]);
  const [kegiatanList, setKegiatanList] = useState<KegiatanRutin[]>([]);
  const [mutasiList, setMutasiList] = useState<MutasiLog[]>([]);
  const [penerimaBantuanList, setPenerimaBantuanList] = useState<PenerimaBantuan[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set the current user and persist in local storage
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('dusun_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dusun_user');
  };

  // Safe fetch helper that falls back to local storage / mocks
  const fetchCollection = async <T extends { id: string | number }>(
    colName: string,
    initialData: T[],
    setter: (data: T[]) => void
  ) => {
    try {
      const snap = await getDocs(collection(db, colName));
      if (snap.empty) {
        // Seed Firestore if empty
        console.log(`Seeding Firestore collection: ${colName}`);
        for (const item of initialData) {
          await setDoc(doc(db, colName, String(item.id)), item);
        }
        setter(initialData);
      } else {
        const data: T[] = [];
        const seenIds = new Set<string | number>();
        snap.forEach((docSnap) => {
          const item = docSnap.data() as T;
          const itemId = item.id;
          if (itemId !== undefined && itemId !== null) {
            if (!seenIds.has(itemId)) {
              seenIds.add(itemId);
              data.push(item);
            } else {
              console.warn(`Duplicate item found in colName: ${colName} with id: ${itemId}, doc ID: ${docSnap.id}. Deleting duplicate document from remote Firestore.`);
              deleteDoc(docSnap.ref).catch((err) => {
                console.error(`Failed to delete duplicate doc: ${docSnap.id}`, err);
              });
            }
          } else {
            const fallbackId = docSnap.id;
            const fallbackItem = { ...item, id: fallbackId };
            if (!seenIds.has(fallbackId)) {
              seenIds.add(fallbackId);
              data.push(fallbackItem);
            }
          }
        });
        // Sort items by ID for consistent display (gracefully supporting both numeric and string/alphanumeric IDs like "RW 01")
        data.sort((a, b) => {
          const numA = Number(a.id);
          const numB = Number(b.id);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: 'base' });
        });
        setter(data);
      }
    } catch (err) {
      console.warn(`Firestore read failed for ${colName}, using offline storage:`, err);
      // Fallback: Read from LocalStorage or use default mock lists
      const localSaved = localStorage.getItem(`offline_${colName}`);
      if (localSaved) {
        setter(JSON.parse(localSaved));
      } else {
        setter(initialData);
        localStorage.setItem(`offline_${colName}`, JSON.stringify(initialData));
      }
    }
  };

  // Sync state changes to both memory, LocalStorage for PWA offline-first, and Firestore
  const updateCollectionState = <T extends { id: string | number }>(
    colName: string,
    updatedList: T[],
    setter: (data: T[]) => void
  ) => {
    setter(updatedList);
    localStorage.setItem(`offline_${colName}`, JSON.stringify(updatedList));
  };

  // Loading all collections on initiation
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await fetchCollection<RW>('rws', INITIAL_RWS, setRwList);
      await fetchCollection<Warga>('warga', INITIAL_WARGA, setWargaList);
      await fetchCollection<Iuran>('iuran', INITIAL_IURAN, setIuranList);
      await fetchCollection<TransaksiIuran>('transaksi', INITIAL_TRANSAKSI, setTransaksiList);
      await fetchCollection<Pengajuan>('pengajuan', INITIAL_PENGAJUAN, setPengajuanList);
      await fetchCollection<Laporan>('laporan', INITIAL_LAPORAN, setLaporanList);
      await fetchCollection<JadwalRonda>('ronda', INITIAL_RONDA, setRondaList);
      await fetchCollection<KegiatanRutin>('kegiatan', INITIAL_KEGIATAN, setKegiatanList);
      await fetchCollection<MutasiLog>('mutasi', INITIAL_MUTASI, setMutasiList);
      await fetchCollection<PenerimaBantuan>('penerimabantuan', INITIAL_PENERIMA, setPenerimaBantuanList);
      await fetchCollection<GalleryPhoto>('gallery', INITIAL_PHOTOS, setGalleryPhotos);
      setLoading(false);
    };
    loadAll();
  }, []);

  // Write citizen list (create & edit)
  const addWarga = async (warga: Omit<Warga, 'id'>) => {
    const newId = wargaList.length > 0 ? Math.max(...wargaList.map(w => w.id)) + 1 : 1;
    const fullWarga: Warga = { ...warga, id: newId };
    
    // Add mutasi log entry instantly
    const mutasiEntry: MutasiLog = {
      id: Date.now(),
      wargaId: newId,
      namaWarga: fullWarga.nama,
      nik: fullWarga.nik,
      kk: fullWarga.kk,
      jenis: 'Pindah Masuk',
      tanggalPeristiwa: fullWarga.tanggalInput,
      keterangan: `Pendaftaran penduduk baru di RW ${fullWarga.rwId}`,
      petugasName: currentUser ? currentUser.nama : 'Ketua RW',
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    const newWargas = [...wargaList, fullWarga];
    const newMutasis = [mutasiEntry, ...mutasiList];

    updateCollectionState<Warga>('warga', newWargas, setWargaList);
    updateCollectionState<MutasiLog>('mutasi', newMutasis, setMutasiList);

    try {
      await setDoc(doc(db, 'warga', String(newId)), fullWarga);
      await setDoc(doc(db, 'mutasi', String(mutasiEntry.id)), mutasiEntry);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `warga/${newId}`);
    }
  };

  const addWargaBulk = async (newWargaList: Omit<Warga, 'id'>[]) => {
    let nextId = wargaList.length > 0 ? Math.max(...wargaList.map(w => w.id)) + 1 : 1;
    const processedWargas: Warga[] = [];
    const processedMutasis: MutasiLog[] = [];
    let mutasiId = Date.now();

    for (const warga of newWargaList) {
      const fullWarga: Warga = { ...warga, id: nextId };
      processedWargas.push(fullWarga);

      const mutasiEntry: MutasiLog = {
        id: mutasiId++,
        wargaId: nextId,
        namaWarga: fullWarga.nama,
        nik: fullWarga.nik,
        kk: fullWarga.kk,
        jenis: 'Pindah Masuk',
        tanggalPeristiwa: fullWarga.tanggalInput || new Date().toISOString().split('T')[0],
        keterangan: `Import kependudukan via Excel`,
        petugasName: currentUser ? currentUser.nama : 'System',
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      processedMutasis.push(mutasiEntry);
      nextId++;
    }

    const newWargas = [...wargaList, ...processedWargas];
    const newMutasis = [...processedMutasis, ...mutasiList];

    updateCollectionState<Warga>('warga', newWargas, setWargaList);
    updateCollectionState<MutasiLog>('mutasi', newMutasis, setMutasiList);

    // Save batch in background
    for (const fw of processedWargas) {
      setDoc(doc(db, 'warga', String(fw.id)), fw).catch(err => {
        console.error(`Firebase import save error for warga ID ${fw.id}`, err);
      });
    }

    for (const mt of processedMutasis) {
      setDoc(doc(db, 'mutasi', String(mt.id)), mt).catch(err => {
        console.error(`Firebase import save error for mutasi ID ${mt.id}`, err);
      });
    }
  };

  const editWarga = async (id: number, edits: Partial<Warga>) => {
    const updated = wargaList.map(w => {
      if (w.id === id) {
        const merged = { ...w, ...edits } as Warga;
        // If status changes, log as mutasi log
        if (edits.status && edits.status !== w.status) {
          let jenisMutasi: MutasiLog['jenis'] = 'Pindah Keluar';
          if (edits.status === 'Meninggal') jenisMutasi = 'Meninggal';
          else if (edits.status === 'Sementara') jenisMutasi = 'Penduduk Sementara';

          const mutasiEntry: MutasiLog = {
            id: Date.now(),
            wargaId: id,
            namaWarga: merged.nama,
            nik: merged.nik,
            kk: merged.kk,
            jenis: jenisMutasi,
            tanggalPeristiwa: new Date().toISOString().split('T')[0],
            keterangan: `Perubahan status kependudukan menjadi: ${edits.status}`,
            petugasName: currentUser ? currentUser.nama : 'Petugas RW',
            timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
          };
          const newMutasis = [mutasiEntry, ...mutasiList];
          updateCollectionState<MutasiLog>('mutasi', newMutasis, setMutasiList);
          setDoc(doc(db, 'mutasi', String(mutasiEntry.id)), mutasiEntry).catch(e => console.error(e));
        }
        return merged;
      }
      return w;
    });

    updateCollectionState<Warga>('warga', updated, setWargaList);

    try {
      await updateDoc(doc(db, 'warga', String(id)), edits);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `warga/${id}`);
    }
  };

  const removeWarga = async (id: number) => {
    const filtered = wargaList.filter(w => w.id !== id);
    updateCollectionState<Warga>('warga', filtered, setWargaList);

    try {
      await deleteDoc(doc(db, 'warga', String(id)));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `warga/${id}`);
    }
  };

  const removeWargaBulk = async (ids: number[]) => {
    const idsSet = new Set(ids);
    const filtered = wargaList.filter(w => !idsSet.has(w.id));
    updateCollectionState<Warga>('warga', filtered, setWargaList);

    try {
      await Promise.all(
        ids.map((id) => deleteDoc(doc(db, 'warga', String(id))))
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `warga/bulk`);
    }
  };

  // Payment iuran management
  const addIuranRecord = async (iuran: Omit<Iuran, 'id'>) => {
    const newId = iuranList.length > 0 ? Math.max(...iuranList.map(i => i.id)) + 1 : 1;
    const fullIuran: Iuran = { ...iuran, id: newId };
    const updated = [...iuranList, fullIuran];
    updateCollectionState<Iuran>('iuran', updated, setIuranList);

    try {
      await setDoc(doc(db, 'iuran', String(newId)), fullIuran);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `iuran/${newId}`);
    }
  };

  const payIuran = async (id: number, amount: number, keterangan: string) => {
    let transactionItem: TransaksiIuran | null = null;
    const updatedIuran = iuranList.map(i => {
      if (i.id === id) {
        const newPaid = i.totalDibayar + amount;
        const statusBayar: Iuran['statusBayar'] = newPaid >= i.jumlah ? 'Lunas' : 'Kurang';
        
        // Register standard finance transaction entry
        const transId = transaksiList.length > 0 ? Math.max(...transaksiList.map(t => t.id)) + 1 : 1;
        transactionItem = {
          id: transId,
          iuranId: id,
          wargaId: i.wargaId,
          tanggal: new Date().toISOString().split('T')[0],
          jenis: 'Masuk',
          jumlah: amount,
          keterangan: keterangan || `Pembayaran Iuran`
        };

        return { ...i, totalDibayar: newPaid, statusBayar };
      }
      return i;
    });

    if (transactionItem) {
      const updatedTrans = [...transaksiList, transactionItem];
      updateCollectionState<TransaksiIuran>('transaksi', updatedTrans, setTransaksiList);
      setDoc(doc(db, 'transaksi', String((transactionItem as TransaksiIuran).id)), transactionItem).catch(e => console.error(e));
    }

    updateCollectionState<Iuran>('iuran', updatedIuran, setIuranList);

    try {
      const matchIuran = updatedIuran.find(i => i.id === id);
      if (matchIuran) {
        await updateDoc(doc(db, 'iuran', String(id)), {
          totalDibayar: matchIuran.totalDibayar,
          statusBayar: matchIuran.statusBayar
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `iuran/${id}`);
    }
  };

  // Add custom finance transaction (Income/Expense)
  const addTransaksi = async (trans: Omit<TransaksiIuran, 'id'>) => {
    const newId = transaksiList.length > 0 ? Math.max(...transaksiList.map(t => t.id)) + 1 : 1;
    const fullTrans: TransaksiIuran = { ...trans, id: newId };
    const updated = [...transaksiList, fullTrans];
    updateCollectionState<TransaksiIuran>('transaksi', updated, setTransaksiList);

    try {
      await setDoc(doc(db, 'transaksi', String(newId)), fullTrans);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `transaksi/${newId}`);
    }
  };

  // Submit aid requests
  const addPengajuan = async (pengajuan: Omit<Pengajuan, 'id' | 'tanggal' | 'status' | 'fotoList'>, files?: string[]) => {
    const newId = pengajuanList.length > 0 ? Math.max(...pengajuanList.map(p => p.id)) + 1 : 1;
    const item: Pengajuan = {
      ...pengajuan,
      id: newId,
      tanggal: new Date().toISOString().split('T')[0],
      status: 'Verifikasi',
      fotoList: files || []
    };

    const updated = [...pengajuanList, item];
    updateCollectionState<Pengajuan>('pengajuan', updated, setPengajuanList);

    try {
      await setDoc(doc(db, 'pengajuan', String(newId)), item);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `pengajuan/${newId}`);
    }
  };

  const updatePengajuanStatus = async (id: number, status: Pengajuan['status'], komentar?: string) => {
    const updated = pengajuanList.map(p => {
      if (p.id === id) {
        return { ...p, status, komentar: komentar || p.komentar };
      }
      return p;
    });

    updateCollectionState<Pengajuan>('pengajuan', updated, setPengajuanList);

    try {
      await updateDoc(doc(db, 'pengajuan', String(id)), { status, komentar: komentar || '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pengajuan/${id}`);
    }
  };

  // Add resident complaints / local reports
  const addLaporan = async (laporan: Omit<Laporan, 'id' | 'tanggal' | 'status' | 'fotoList'>, files?: string[]) => {
    const newId = laporanList.length > 0 ? Math.max(...laporanList.map(l => l.id)) + 1 : 1;
    const item: Laporan = {
      ...laporan,
      id: newId,
      tanggal: new Date().toISOString().split('T')[0],
      status: 'Diproses',
      fotoList: files || []
    };

    const updated = [...laporanList, item];
    updateCollectionState<Laporan>('laporan', updated, setLaporanList);

    try {
      await setDoc(doc(db, 'laporan', String(newId)), item);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `laporan/${newId}`);
    }
  };

  const updateLaporanStatus = async (id: number, status: Laporan['status'], komentarAdmin?: string) => {
    const updated = laporanList.map(l => {
      if (l.id === id) {
        return { ...l, status, komentarAdmin: komentarAdmin || l.komentarAdmin };
      }
      return l;
    });

    updateCollectionState<Laporan>('laporan', updated, setLaporanList);

    try {
      await updateDoc(doc(db, 'laporan', String(id)), { status, komentarAdmin: komentarAdmin || '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `laporan/${id}`);
    }
  };

  // Ronda Schedules updates
  const addRonda = async (ronda: Omit<JadwalRonda, 'id'>) => {
    const newId = rondaList.length > 0 ? Math.max(...rondaList.map(r => r.id)) + 1 : 1;
    const item: JadwalRonda = { ...ronda, id: newId };
    const updated = [...rondaList, item];
    updateCollectionState<JadwalRonda>('ronda', updated, setRondaList);

    try {
      await setDoc(doc(db, 'ronda', String(newId)), item);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `ronda/${newId}`);
    }
  };

  const removeRonda = async (id: number) => {
    const filtered = rondaList.filter(r => r.id !== id);
    updateCollectionState<JadwalRonda>('ronda', filtered, setRondaList);

    try {
      await deleteDoc(doc(db, 'ronda', String(id)));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `ronda/${id}`);
    }
  };

  // Agenda / Kegiatan Rutin management
  const addKegiatan = async (kegiatan: Omit<KegiatanRutin, 'id'>) => {
    const newId = kegiatanList.length > 0 ? Math.max(...kegiatanList.map(k => k.id)) + 1 : 1;
    const item: KegiatanRutin = { ...kegiatan, id: newId };
    const updated = [...kegiatanList, item];
    updateCollectionState<KegiatanRutin>('kegiatan', updated, setKegiatanList);

    try {
      await setDoc(doc(db, 'kegiatan', String(newId)), item);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `kegiatan/${newId}`);
    }
  };

  const removeKegiatan = async (id: number) => {
    const filtered = kegiatanList.filter(k => k.id !== id);
    updateCollectionState<KegiatanRutin>('kegiatan', filtered, setKegiatanList);

    try {
      await deleteDoc(doc(db, 'kegiatan', String(id)));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `kegiatan/${id}`);
    }
  };

  // Penerima Bantuan management
  const addPenerimaBantuan = async (penerima: Omit<PenerimaBantuan, 'id' | 'tanggalInput'>) => {
    const newId = penerimaBantuanList.length > 0 ? Math.max(...penerimaBantuanList.map(p => p.id)) + 1 : 1;
    const item: PenerimaBantuan = {
      ...penerima,
      id: newId,
      tanggalInput: new Date().toISOString().split('T')[0]
    };
    const updated = [...penerimaBantuanList, item];
    updateCollectionState<PenerimaBantuan>('penerimabantuan', updated, setPenerimaBantuanList);

    try {
      await setDoc(doc(db, 'penerimabantuan', String(newId)), item);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `penerimabantuan/${newId}`);
    }
  };

  const editPenerimaBantuan = async (id: number, edits: Partial<PenerimaBantuan>) => {
    const updated = penerimaBantuanList.map(p => {
      if (p.id === id) {
        return { ...p, ...edits } as PenerimaBantuan;
      }
      return p;
    });
    updateCollectionState<PenerimaBantuan>('penerimabantuan', updated, setPenerimaBantuanList);

    try {
      await updateDoc(doc(db, 'penerimabantuan', String(id)), edits);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `penerimabantuan/${id}`);
    }
  };

  const removePenerimaBantuan = async (id: number) => {
    const filtered = penerimaBantuanList.filter(p => p.id !== id);
    updateCollectionState<PenerimaBantuan>('penerimabantuan', filtered, setPenerimaBantuanList);

    try {
      await deleteDoc(doc(db, 'penerimabantuan', String(id)));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `penerimabantuan/${id}`);
    }
  };

  // Gallery CRUD Operations
  const addGalleryPhoto = async (photo: Omit<GalleryPhoto, 'id' | 'date'>) => {
    const newId = galleryPhotos.length > 0 ? Math.max(...galleryPhotos.map(p => p.id)) + 1 : 1;
    const item: GalleryPhoto = {
      ...photo,
      id: newId,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [...galleryPhotos, item];
    updateCollectionState<GalleryPhoto>('gallery', updated, setGalleryPhotos);

    try {
      await setDoc(doc(db, 'gallery', String(newId)), item);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `gallery/${newId}`);
    }
  };

  const editGalleryPhoto = async (id: number, edits: Partial<GalleryPhoto>) => {
    const updated = galleryPhotos.map(p => {
      if (p.id === id) {
        return { ...p, ...edits } as GalleryPhoto;
      }
      return p;
    });
    updateCollectionState<GalleryPhoto>('gallery', updated, setGalleryPhotos);

    try {
      await updateDoc(doc(db, 'gallery', String(id)), edits);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `gallery/${id}`);
    }
  };

  const removeGalleryPhoto = async (id: number) => {
    const filtered = galleryPhotos.filter(p => p.id !== id);
    updateCollectionState<GalleryPhoto>('gallery', filtered, setGalleryPhotos);

    try {
      await deleteDoc(doc(db, 'gallery', String(id)));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `gallery/${id}`);
    }
  };

  const restoreWargaBackup = async (backupWargas: Warga[], mode: 'overwrite' | 'merge') => {
    let newWargas: Warga[] = [];
    if (mode === 'overwrite') {
      // 1. Delete all existing warga docs from Firestore in background
      for (const w of wargaList) {
        deleteDoc(doc(db, 'warga', String(w.id))).catch(err => {
          console.error(`Firebase restore clear error for ID ${w.id}`, err);
        });
      }
      newWargas = [...backupWargas];
    } else {
      // mode === 'merge'
      // Merge: Keep existing, append backup citizens that don't exist by NIK
      const existingMap = new Map(wargaList.map(w => [w.id, w]));
      const existingNiks = new Set(wargaList.map(w => w.nik));
      
      let nextId = wargaList.length > 0 ? Math.max(...wargaList.map(w => w.id)) + 1 : 1;
      const mergedList = [...wargaList];

      for (const bw of backupWargas) {
        if (existingNiks.has(bw.nik)) {
          // Skip if NIK already exists to prevent duplicate citizens
          continue;
        }
        // Assign a clean unique ID if the ID already exists in the destination
        let targetId = bw.id;
        if (existingMap.has(targetId)) {
          targetId = nextId++;
        }
        const restoredCitizen: Warga = { ...bw, id: targetId };
        mergedList.push(restoredCitizen);
        existingMap.set(targetId, restoredCitizen);
        existingNiks.add(bw.nik);
      }
      newWargas = mergedList;
    }

    // Sort new list by ID
    newWargas.sort((a, b) => Number(a.id) - Number(b.id));

    // Update state & LocalStorage
    updateCollectionState<Warga>('warga', newWargas, setWargaList);

    // Save/Overwrite in remote Firestore
    for (const w of newWargas) {
      setDoc(doc(db, 'warga', String(w.id)), w).catch(err => {
        console.error(`Firebase restore save error for warga ID ${w.id}`, err);
      });
    }

    // Add mutasi log entry of this restore operation
    const restoreLog: MutasiLog = {
      id: Date.now(),
      wargaId: 0,
      namaWarga: 'SYSTEM RESTORE',
      nik: '-',
      kk: '-',
      jenis: 'Pindah Masuk',
      tanggalPeristiwa: new Date().toISOString().split('T')[0],
      keterangan: `Pemulihan cadangan data warga (${backupWargas.length} jiwa) - Mode: ${mode === 'overwrite' ? 'Kosongkan & Timpa' : 'Gabungkan'}`,
      petugasName: currentUser ? currentUser.nama : 'Admin',
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    const newMutasis = [restoreLog, ...mutasiList];
    updateCollectionState<MutasiLog>('mutasi', newMutasis, setMutasiList);
    setDoc(doc(db, 'mutasi', String(restoreLog.id)), restoreLog).catch(err => {
      console.error(`Firebase restore logging error:`, err);
    });
  };

  return {
    currentUser,
    handleLogin,
    handleLogout,
    wargaList,
    addWarga,
    addWargaBulk,
    editWarga,
    removeWarga,
    removeWargaBulk,
    restoreWargaBackup,
    rwList,
    iuranList,
    addIuranRecord,
    payIuran,
    addTransaksi,
    transaksiList,
    pengajuanList,
    addPengajuan,
    updatePengajuanStatus,
    laporanList,
    addLaporan,
    updateLaporanStatus,
    rondaList,
    addRonda,
    removeRonda,
    kegiatanList,
    addKegiatan,
    removeKegiatan,
    mutasiList,
    penerimaBantuanList,
    addPenerimaBantuan,
    editPenerimaBantuan,
    removePenerimaBantuan,
    galleryPhotos,
    addGalleryPhoto,
    editGalleryPhoto,
    removeGalleryPhoto,
    loading,
    errorMessage
  };
}
