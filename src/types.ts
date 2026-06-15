export interface User {
  id: string;
  username: string;
  nama: string;
  role: 'Admin' | 'User';
  rwId?: string;
}

export interface Warga {
  id: number;
  nik: string;
  kk: string;
  nama: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jk: 'L' | 'P';
  agama?: string;
  pendidikan?: string;
  pekerjaan?: string;
  golonganDarah?: string;
  rt?: string;
  hubungan?: string;
  alamat?: string;
  kontak?: string;
  rwId: string;
  status: 'Aktif' | 'Meninggal' | 'Pindah' | 'Sementara';
  foto?: string;
  catatan?: string;
  tanggalInput: string;
}

export interface RW {
  id: string;
  namaKetua: string;
  wilayah: string;
  kontak: string;
}

export interface Iuran {
  id: number;
  wargaId: number;
  bulanTahun: string; // e.g., 'Juni 2026'
  jumlah: number;
  totalDibayar: number;
  statusBayar: 'Lunas' | 'Kurang' | 'Belum Bayar';
}

export interface TransaksiIuran {
  id: number;
  iuranId: number;
  wargaId: number;
  tanggal: string;
  jenis: 'Masuk' | 'Keluar';
  jumlah: number;
  keterangan: string;
}

export interface Pengajuan {
  id: number;
  wargaId: number;
  rwId: string;
  jenis: 'Rutilahu' | 'Pembangunan' | 'Bansos';
  deskripsi: string;
  tanggal: string;
  status: 'Draft' | 'Kirim' | 'Verifikasi' | 'Setuju' | 'Tolak';
  fotoList: string[]; // URLs or base64
  komentar?: string;
  koordinat?: string;
}

export interface Laporan {
  id: number;
  rwId: string;
  wargaId: number;
  kategori: 'Kegiatan' | 'Kejadian' | 'Pengaduan';
  deskripsi: string;
  tanggal: string;
  fotoList: string[];
  status: 'Diproses' | 'Selesai' | 'Arsip';
  komentarAdmin?: string;
  koordinat?: string;
}

export interface MutasiLog {
  id: number;
  wargaId: number;
  namaWarga: string;
  nik: string;
  kk: string;
  jenis: 'Lahir' | 'Meninggal' | 'Pindah Masuk' | 'Pindah Keluar' | 'Penduduk Sementara';
  tanggalPeristiwa: string;
  keterangan: string;
  petugasName: string;
  timestamp: string;
}

export interface JadwalRonda {
  id: number;
  rwId: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  wargaIds: number[]; // citizen IDs assigned
  lokasiSektor: string;
  jamMulai: string;
  jamSelesai: string;
  keterangan?: string;
}

export interface KegiatanRutin {
  id: number;
  rwId: string;
  nama: string;
  kategori: 'Kesehatan' | 'Keagamaan' | 'Gotong Royong' | 'Sosial' | 'Rapat / Musyawarah';
  frekuensi: string;
  lokasi: string;
  waktu: string;
  penanggungJawab: string;
  deskripsi: string;
}

export interface PenerimaBantuan {
  id: number;
  wargaId: number;
  jenisBantuan: 'PKH' | 'PKH+BPNT' | 'BANTUAN PANGAN' | 'Bantuan Lainnya';
  keterangan: string;
  nominal?: string; // e.g. "Rp 600.000", "Beras 10 Kg", "Kartu Bansos"
  tanggalInput: string;
  rwId: string;
}

export interface GalleryPhoto {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: 'Gotong Royong' | 'Pemberian Bansos' | 'Siskamling' | 'Posyandu' | 'Kegiatan Desa';
  date: string;
  reporter: string;
}

