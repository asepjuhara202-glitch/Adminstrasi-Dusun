import { Warga, RW, Iuran, TransaksiIuran, Pengajuan, Laporan, JadwalRonda, KegiatanRutin, MutasiLog, PenerimaBantuan, GalleryPhoto } from '../types';

export const INITIAL_RWS: RW[] = [
  { id: 'RW 07', namaKetua: 'Miftah', wilayah: 'Dusun III', kontak: '0812-3456-7890' },
  { id: 'RW 08', namaKetua: 'Darmatin', wilayah: 'Dusun III', kontak: '0821-4567-9012' },
  { id: 'RW 09', namaKetua: 'Sulam', wilayah: 'Dusun III', kontak: '0838-5678-2345' },
  { id: 'RW 13', namaKetua: 'Ajang', wilayah: 'Dusun III', kontak: '0857-6789-3456' }
  { id: 'RW 15', namaKetua: 'Fuad', wilayah: 'Dusun III', kontak: '0857-6789-3456' }
  { id: 'RW 16', namaKetua: 'Endang', wilayah: 'Dusun III', kontak: '0857-6789-3456' }
  { id: 'RW 17', namaKetua: 'Jajang', wilayah: 'Dusun III', kontak: '0857-6789-3456' }
];

export const INITIAL_WARGA: Warga[] = [
  {
    id: 1,
    nik: '3204121203850001',
    kk: '3204121504100004',
    nama: 'Budi Santoso',
    tempatLahir: 'Bandung',
    tanggalLahir: '12 Maret 1985',
    jk: 'L',
    agama: 'Islam',
    pendidikan: 'SMA',
    pekerjaan: 'Wiraswasta',
    golonganDarah: 'O',
    rt: '01',
    hubungan: 'Kepala Keluarga',
    alamat: 'RT 01 / RW 01, Kampung Sukamaju',
    kontak: '0812-1111-2222',
    rwId: 'RW 01',
    status: 'Aktif',
    tanggalInput: '2026-01-10'
  },
  {
    id: 2,
    nik: '3204122405880002',
    kk: '3204121504100004',
    nama: 'Siti Aminah',
    tempatLahir: 'Bandung',
    tanggalLahir: '24 Mei 1988',
    jk: 'P',
    agama: 'Islam',
    pendidikan: 'D3',
    pekerjaan: 'Ibu Rumah Tangga',
    golonganDarah: 'A',
    rt: '01',
    hubungan: 'Istri',
    alamat: 'RT 01 / RW 01, Kampung Sukamaju',
    kontak: '0812-3333-4444',
    rwId: 'RW 01',
    status: 'Aktif',
    tanggalInput: '2026-01-10'
  },
  {
    id: 3,
    nik: '3204121010150003',
    kk: '3204121504100004',
    nama: 'Rizky Pratama',
    tempatLahir: 'Bandung',
    tanggalLahir: '10 Oktober 2015',
    jk: 'L',
    agama: 'Islam',
    pendidikan: 'SD',
    pekerjaan: 'Pelajar',
    golonganDarah: 'O',
    rt: '01',
    hubungan: 'Anak',
    alamat: 'RT 01 / RW 01, Kampung Sukamaju',
    rwId: 'RW 01',
    status: 'Aktif',
    tanggalInput: '2026-01-10'
  },
  {
    id: 4,
    nik: '3204121101700001',
    kk: '3204121506080001',
    nama: 'Joko Widodo',
    tempatLahir: 'Solo',
    tanggalLahir: '11 Januari 1970',
    jk: 'L',
    agama: 'Islam',
    pendidikan: 'S1',
    pekerjaan: 'Buruh Harian',
    golonganDarah: 'B',
    rt: '03',
    hubungan: 'Kepala Keluarga',
    alamat: 'RT 03 / RW 02, Kampung Sukamaju',
    kontak: '0852-2222-3333',
    rwId: 'RW 02',
    status: 'Aktif',
    tanggalInput: '2026-02-15'
  },
  {
    id: 5,
    nik: '3204122008740003',
    kk: '3204121506080001',
    nama: 'Sri Wahyuni',
    tempatLahir: 'Solo',
    tanggalLahir: '20 Agustus 1974',
    jk: 'P',
    agama: 'Islam',
    pendidikan: 'SMA',
    pekerjaan: 'Pedagang Kelontong',
    golonganDarah: 'AB',
    rt: '03',
    hubungan: 'Istri',
    alamat: 'RT 03 / RW 02, Kampung Sukamaju',
    kontak: '0852-4444-5555',
    rwId: 'RW 02',
    status: 'Aktif',
    tanggalInput: '2026-02-15'
  },
  {
    id: 6,
    nik: '3204120505500002',
    kk: '3204120909100002',
    nama: 'Kusnan',
    tempatLahir: 'Garut',
    tanggalLahir: '5 Mei 1950',
    jk: 'L',
    agama: 'Islam',
    pendidikan: 'SD',
    pekerjaan: 'Pensiunan',
    golonganDarah: 'A',
    rt: '05',
    hubungan: 'Kepala Keluarga',
    alamat: 'RT 05 / RW 03, Kampung Sukamaju',
    rwId: 'RW 03',
    status: 'Aktif',
    tanggalInput: '2026-03-05'
  },
  {
    id: 7,
    nik: '3204124912550001',
    kk: '3204120909100002',
    nama: 'Halimah',
    tempatLahir: 'Garut',
    tanggalLahir: '9 Desember 1955',
    jk: 'P',
    agama: 'Islam',
    pendidikan: 'SD',
    pekerjaan: 'Ibu Rumah Tangga',
    golonganDarah: 'O',
    rt: '05',
    hubungan: 'Istri',
    alamat: 'RT 05 / RW 03, Kampung Sukamaju',
    rwId: 'RW 03',
    status: 'Aktif',
    tanggalInput: '2026-03-05'
  },
  {
    id: 8,
    nik: '3204120803920005',
    kk: '3204121111950002',
    nama: 'Danny Ramadhan',
    tempatLahir: 'Bandung',
    tanggalLahir: '8 Maret 1992',
    jk: 'L',
    agama: 'Islam',
    pendidikan: 'Diploma',
    pekerjaan: 'Karyawan Swasta',
    golonganDarah: 'B',
    rt: '08',
    hubungan: 'Kepala Keluarga',
    alamat: 'RT 08 / RW 04, Kampung Sukamaju',
    kontak: '0838-8888-9999',
    rwId: 'RW 04',
    status: 'Aktif',
    tanggalInput: '2026-04-12'
  },
  {
    id: 9,
    nik: '3204125807960002',
    kk: '3204121111950002',
    nama: 'Dewi Lestari',
    tempatLahir: 'Cianjur',
    tanggalLahir: '18 Juli 1996',
    jk: 'P',
    agama: 'Islam',
    pendidikan: 'S1',
    pekerjaan: 'Guru TK',
    golonganDarah: 'A',
    rt: '08',
    hubungan: 'Istri',
    alamat: 'RT 08 / RW 04, Kampung Sukamaju',
    kontak: '0838-0000-1111',
    rwId: 'RW 04',
    status: 'Aktif',
    tanggalInput: '2026-04-12'
  },
  {
    id: 10,
    nik: '3204123011400004',
    kk: '3204113010410001',
    nama: 'Sastro Wardoyo',
    tempatLahir: 'Yogyakarta',
    tanggalLahir: '30 November 1940',
    jk: 'L',
    agama: 'Islam',
    pendidikan: 'SD',
    pekerjaan: 'Tidak Bekerja',
    golonganDarah: 'O',
    rt: '02',
    hubungan: 'Kepala Keluarga',
    alamat: 'RT 02 / RW 01, Kampung Sukamaju',
    rwId: 'RW 01',
    status: 'Aktif',
    tanggalInput: '2026-01-20'
  }
];

export const INITIAL_IURAN: Iuran[] = [
  { id: 1, wargaId: 1, bulanTahun: 'Juni 2026', jumlah: 25000, totalDibayar: 25000, statusBayar: 'Lunas' },
  { id: 2, wargaId: 4, bulanTahun: 'Juni 2026', jumlah: 25000, totalDibayar: 10000, statusBayar: 'Kurang' },
  { id: 3, wargaId: 6, bulanTahun: 'Juni 2026', jumlah: 25000, totalDibayar: 0, statusBayar: 'Belum Bayar' },
  { id: 4, wargaId: 8, bulanTahun: 'Juni 2026', jumlah: 25000, totalDibayar: 25000, statusBayar: 'Lunas' },
  { id: 5, wargaId: 10, bulanTahun: 'Juni 2026', jumlah: 25000, totalDibayar: 0, statusBayar: 'Belum Bayar' },
  { id: 6, wargaId: 1, bulanTahun: 'Mei 2026', jumlah: 25000, totalDibayar: 25000, statusBayar: 'Lunas' },
  { id: 7, wargaId: 4, bulanTahun: 'Mei 2026', jumlah: 25000, totalDibayar: 25000, statusBayar: 'Lunas' },
  { id: 8, wargaId: 6, bulanTahun: 'Mei 2026', jumlah: 25000, totalDibayar: 25000, statusBayar: 'Lunas' },
  { id: 9, wargaId: 8, bulanTahun: 'Mei 2026', jumlah: 25000, totalDibayar: 25000, statusBayar: 'Lunas' },
  { id: 10, wargaId: 10, bulanTahun: 'Mei 2026', jumlah: 25000, totalDibayar: 0, statusBayar: 'Belum Bayar' }
];

export const INITIAL_TRANSAKSI: TransaksiIuran[] = [
  { id: 1, iuranId: 1, wargaId: 1, tanggal: '2026-06-02', jenis: 'Masuk', jumlah: 25000, keterangan: 'Iuran Juni Budi Santoso' },
  { id: 2, iuranId: 2, wargaId: 4, tanggal: '2026-06-03', jenis: 'Masuk', jumlah: 10000, keterangan: 'Pembayaran sebagian Iuran Juni Joko Widodo' },
  { id: 3, iuranId: 4, wargaId: 8, tanggal: '2026-06-05', jenis: 'Masuk', jumlah: 25000, keterangan: 'Iuran Juni Danny Ramadhan' },
  { id: 4, iuranId: 6, wargaId: 1, tanggal: '2026-05-02', jenis: 'Masuk', jumlah: 25000, keterangan: 'Iuran Mei Budi Santoso' },
  { id: 5, iuranId: 7, wargaId: 4, tanggal: '2026-05-04', jenis: 'Masuk', jumlah: 25000, keterangan: 'Iuran CC Mei Joko Widodo' }
];

export const INITIAL_PENGAJUAN: Pengajuan[] = [
  {
    id: 1,
    wargaId: 10,
    rwId: 'RW 01',
    jenis: 'Bansos',
    deskripsi: 'Bansos Sembako Lansia untuk keluarga Mbah Sastro Wardoyo yang tidak berpenghasilan.',
    tanggal: '2026-06-10',
    status: 'Verifikasi',
    fotoList: []
  },
  {
    id: 2,
    wargaId: 4,
    rwId: 'RW 02',
    jenis: 'Rutilahu',
    deskripsi: 'Pengajuan Renovasi Rumah Tidak Layak Huni (Rutilahu) atap bocor parah dan dinding kayu lapuk.',
    tanggal: '2026-05-20',
    status: 'Setuju',
    fotoList: [],
    komentar: 'Disetujui untuk diusulkan ke tingkat Kelurahan/Kecamatan di gelombang II.'
  }
];

export const INITIAL_LAPORAN: Laporan[] = [
  {
    id: 1,
    rwId: 'RW 01',
    wargaId: 1,
    kategori: 'Kejadian',
    deskripsi: 'Lampu penerangan jalan utama dekat RT 02 mati total, membuat malam hari rawan kriminalitas.',
    tanggal: '2026-06-08',
    fotoList: [],
    status: 'Diproses',
    komentarAdmin: 'Sedang berkoodinasi dengan petugas PLN desa untuk perbaikan bohlam dan instalasi.'
  },
  {
    id: 2,
    rwId: 'RW 04',
    wargaId: 8,
    kategori: 'Kegiatan',
    deskripsi: 'Agenda Musyawarah RW dan Pemilihan Pengurus Karang Taruna Baru Sukamaju berhasil dilaksanakan dengan kondusif.',
    tanggal: '2026-06-11',
    fotoList: [],
    status: 'Selesai'
  }
];

export const INITIAL_RONDA: JadwalRonda[] = [
  { id: 1, rwId: 'RW 01', hari: 'Senin', wargaIds: [1, 3], lokasiSektor: 'Pos Ronda RT 01', jamMulai: '22:00', jamSelesai: '04:00', keterangan: 'Petugas membawa kentongan & senter.' },
  { id: 2, rwId: 'RW 01', hari: 'Selasa', wargaIds: [10], lokasiSektor: 'Pos Ronda RT 02', jamMulai: '22:00', jamSelesai: '04:00' },
  { id: 3, rwId: 'RW 02', hari: 'Rabu', wargaIds: [4], lokasiSektor: 'Gardan RT 03', jamMulai: '21:00', jamSelesai: '03:00' },
  { id: 4, rwId: 'RW 04', hari: 'Sabtu', wargaIds: [8], lokasiSektor: 'Pos Gerbang Barat', jamMulai: '22:00', jamSelesai: '04:00' }
];

export const INITIAL_KEGIATAN: KegiatanRutin[] = [
  {
    id: 1,
    rwId: 'RW 01',
    nama: 'Posyandu Lansia & Balita Sehat',
    kategori: 'Kesehatan',
    frekuensi: 'Setiap sebulan sekali (Kamis Pertama)',
    lokasi: 'Balai RW 01',
    waktu: '08:00 - 12:00 WIB',
    penanggungJawab: 'Ibu Bidan Nurjanah',
    deskripsi: 'Penimbangan balita, imunisasi dasar, pemeriksaan tekanan darah & pembagian makanan bergizi lansia.'
  },
  {
    id: 2,
    rwId: 'RW 03',
    nama: 'Kerja Bakti Kebersihan Lingkungan RT 05',
    kategori: 'Gotong Royong',
    frekuensi: 'Mingguan (Minggu Pagi)',
    lokasi: 'Sepanjang Selokan Utama Terusan Barat',
    waktu: '07:00 - selesai',
    penanggungJawab: 'Bapak RW Agus Setiawan',
    deskripsi: 'Pembersihan saluran air menyambut musim penghujan guna meminimalisir penumpukan lumpur sawah.'
  }
];

export const INITIAL_MUTASI: MutasiLog[] = [
  {
    id: 1,
    wargaId: 3,
    namaWarga: 'Ahmad Rafli (Lahir)',
    nik: '3204121010150003',
    kk: '3204121504100004',
    jenis: 'Lahir',
    tanggalPeristiwa: '2026-05-15',
    keterangan: 'Kelahiran anak kedua dari keluarga Bapak Budi Santoso.',
    petugasName: 'Ketua RW 01',
    timestamp: '2026-05-16 09:30'
  }
];

export const INITIAL_PENERIMA: PenerimaBantuan[] = [
  {
    id: 1,
    wargaId: 1,
    jenisBantuan: 'PKH',
    keterangan: 'Penerima Program Keluarga Harapan karena kategori Ibu Hamil/Anak Sekolah',
    nominal: 'Rp 600.000 / Tahap',
    tanggalInput: '2026-02-15',
    rwId: 'RW 01'
  },
  {
    id: 2,
    wargaId: 2,
    jenisBantuan: 'PKH+BPNT',
    keterangan: 'Keluarga pra-sejahtera mendapatkan bantuan sembako rutin Kartu Sembako plus PKH lansia',
    nominal: 'Paket Sembako + Rp 200.000',
    tanggalInput: '2026-03-10',
    rwId: 'RW 01'
  },
  {
    id: 3,
    wargaId: 3,
    jenisBantuan: 'BANTUAN PANGAN',
    keterangan: 'Pemberian Cadangan Beras Pemerintah (CBP) 10 Kg bulanan',
    nominal: 'Beras 10 Kg',
    tanggalInput: '2026-04-22',
    rwId: 'RW 01'
  }
];

export const INITIAL_PHOTOS: GalleryPhoto[] = [
  {
    id: 1,
    title: 'Gotong Royong Bersihkan Saluran Irigasi',
    description: 'Warga RW 01 berkumpul membersihkan irigasi persawahan guna mencegah banjir musiman.',
    imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=600',
    category: 'Gotong Royong',
    date: '2026-05-12',
    reporter: 'Ketua RW 01'
  },
  {
    id: 2,
    title: 'Peneriksaan Kesehatan Balita Posyandu Melati',
    description: 'Kegiatan imunisasi dan penimbangan rutin bulanan balita sektor RT 03/RW 02.',
    imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=600',
    category: 'Posyandu',
    date: '2026-06-02',
    reporter: 'Ketua RW 02'
  },
  {
    id: 3,
    title: 'Ronda Malam Bergilir Sektor Barat',
    description: 'Petugas siskamling malam meningkatkan pengawasan lingkungan guna keamanan warga.',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600',
    category: 'Siskamling',
    date: '2026-06-10',
    reporter: 'Ketua RW 03'
  },
  {
    id: 4,
    title: 'Penyaluran Beras Cadangan Pemerintah bulangan',
    description: 'Penyaluran bantuan pangan beras 10 Kg untuk keluarga penerima manfaat secara tertib.',
    imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600',
    category: 'Pemberian Bansos',
    date: '2026-06-14',
    reporter: 'Admin Desa'
  }
];

