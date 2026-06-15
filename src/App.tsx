import React, { useState, useEffect } from 'react';
import { useDusunStore } from './lib/store';
import { LoginModal } from './components/LoginModal';
import { WargaTab } from './components/WargaTab';
import { IuranTab } from './components/IuranTab';
import { BansosTab } from './components/BansosTab';
import { LaporanTab } from './components/LaporanTab';
import { AgendaTab } from './components/AgendaTab';
import { PenerimaTab } from './components/PenerimaTab';
import { DashboardCharts } from './components/DashboardCharts';
import { DashboardGallery } from './components/DashboardGallery';
import { 
  Home, 
  Users, 
  Wallet, 
  HeartHandshake, 
  MessageSquare, 
  CalendarClock, 
  ShieldAlert, 
  Lock, 
  Menu, 
  X,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  Gift
} from 'lucide-react';

export default function App() {
  const store = useDusunStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'warga' | 'iuran' | 'bansos' | 'penerima' | 'laporan' | 'agenda'>('dashboard');
  const [showLoginPanel, setShowLoginPanel] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('dusun_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('dusun_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Statistics calculation for counts
  const isAdmin = store.currentUser?.role === 'Admin';
  const userRwId = store.currentUser?.rwId;

  const totalWarga = store.wargaList.filter(w => w.status === 'Aktif' && (isAdmin || w.rwId === userRwId)).length;
  const pendingBansosCount = store.pengajuanList.filter(p => p.status === 'Verifikasi' && (isAdmin || p.rwId === userRwId)).length;
  const pendingLaporanCount = store.laporanList.filter(l => l.status === 'Diproses' && (isAdmin || l.rwId === userRwId)).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-800 lg:hidden rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="p-2 bg-indigo-650 text-white rounded-xl shadow-xs">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">Sukamaju Mandiri</h1>
              <p className="text-xxs text-slate-450 dark:text-slate-400 mt-1 font-bold">Portal Administrasi Dusun & RW</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-150 dark:border-slate-700 shadow-xxs transition cursor-pointer"
              title={theme === 'dark' ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600 dark:text-slate-350" />}
            </button>

            {/* Display logged in accounts */}
            {store.currentUser ? (
              <div className="flex items-center gap-2.5">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{store.currentUser.nama}</p>
                  <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{store.currentUser.role === 'Admin' ? 'Kepala Dusun (Admin)' : `Ketua ${store.currentUser.rwId}`}</p>
                </div>
                <button
                  onClick={() => setShowLoginPanel(!showLoginPanel)}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-150 text-slate-700 text-xs font-bold transition"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Ganti Otoritas
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginPanel(true)}
                className="py-1.5 px-4.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                Log Masuk
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6 relative">
        
        {/* Left Sidebar Layout */}
        <aside className={`w-64 flex-shrink-0 bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-1 shadow-xs absolute lg:sticky lg:top-22 z-20 transition-all ${
          mobileMenuOpen ? 'left-4 top-6 opacity-100' : 'opacity-0 scale-95 pointer-events-none lg:opacity-100 lg:scale-100 lg:pointer-events-auto lg:left-0'
        }`}>
          <div className="px-3 mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menu Navigasi</span>
          </div>

          <button
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition ${
              activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <Home className="w-4 h-4" />
            Beranda Utama
          </button>

          <button
            onClick={() => { setActiveTab('warga'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
              activeTab === 'warga' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              Kelola Warga
            </span>
            <span className="text-xxs px-1.5 bg-slate-100 font-bold rounded-lg text-slate-500">{totalWarga}</span>
          </button>

          <button
            onClick={() => { setActiveTab('iuran'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition ${
              activeTab === 'iuran' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Lembaga Keuangan RW
          </button>

          <button
            onClick={() => { setActiveTab('bansos'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
              activeTab === 'bansos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-3">
              <HeartHandshake className="w-4 h-4" />
              Pengajuan Bansos
            </span>
            {pendingBansosCount > 0 && (
              <span className="text-[10px] py-0.5 px-1.5 bg-amber-500 font-bold rounded-lg text-white animate-pulse">{pendingBansosCount}</span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('penerima'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
              activeTab === 'penerima' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-3">
              <Gift className="w-4 h-4" />
              Penerima Bantuan
            </span>
            <span className="text-[10px] py-0.5 px-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-lg leading-none">
              {(isAdmin ? store.penerimaBantuanList : store.penerimaBantuanList.filter(p => p.rwId === (store.currentUser?.rwId || 'RW 01'))).length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('laporan'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
              activeTab === 'laporan' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4" />
              Pengaduan & Giat
            </span>
            {pendingLaporanCount > 0 && (
              <span className="text-[10px] py-0.5 px-1.5 bg-amber-500 font-bold rounded-lg text-white">{pendingLaporanCount}</span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('agenda'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition ${
              activeTab === 'agenda' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            Ronda & Agenda
          </button>
        </aside>

        {/* Dynamic Content Frame */}
        <main className="flex-grow flex flex-col gap-6">

          {/* Login modal sidebar-top drawer */}
          {showLoginPanel && (
            <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-xxs flex justify-end p-4 z-40">
              <div className="relative">
                <button 
                  onClick={() => setShowLoginPanel(false)}
                  className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg bg-slate-50"
                >
                  <X className="w-5 h-5" />
                </button>
                <LoginModal 
                  currentUser={store.currentUser}
                  onLogin={(user) => { store.handleLogin(user); setShowLoginPanel(false); }}
                  onLogout={() => { store.handleLogout(); setShowLoginPanel(false); }}
                />
              </div>
            </div>
          )}

          {/* Interactive tabs router */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Grand Banner welcome message */}
              <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Home className="w-64 h-64" />
                </div>
                <div className="relative max-w-lg space-y-2.5">
                  <span className="inline-flex gap-1.5 items-center bg-indigo-600 py-1 px-3 rounded-full text-xxs font-extrabold uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5" /> Administrasi Pintar
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">Sugeng Rawuh, Selamat Datang di Sukamaju Mandiri</h2>
                  <p className="text-xs sm:text-sm text-indigo-150 leading-relaxed font-semibold">Portal pintar terpadu warga Dusun Sukamaju - Kelola data demografi kependudukan, pengumpulan kas iuran RW, proposal rutilahu/bansos, dan agenda ronda siskamling secara instan.</p>
                  
                  <div className="pt-2">
                    <button 
                      onClick={() => setActiveTab('warga')}
                      className="inline-flex items-center gap-1.5 text-xs bg-white text-indigo-700 py-2.5 px-5 rounded-2xl font-bold shadow-xs hover:bg-slate-50 transition"
                    >
                      Buka Penduduk <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Highlights widget grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Pending Bansos */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-xxs">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kasun Bansos Pending</h3>
                    <span className="text-4xl font-extrabold text-slate-800">{pendingBansosCount}</span>
                  </div>
                  <p className="text-xxs text-slate-500 mt-4 font-semibold">Proposal proposal bansos terekam masuk menunggu persetujuan anda.</p>
                </div>

                {/* Active Complaints */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-xxs">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Aduan Warga Berjalan</h3>
                    <span className="text-4xl font-extrabold text-slate-800">{pendingLaporanCount}</span>
                  </div>
                  <p className="text-xxs text-slate-500 mt-4 font-semibold">Pengaduan masyarakat sedang dalam proses pengerjaan PLN/pimpinan.</p>
                </div>

                {/* Sector count */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-xxs">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Wilayah Terdata</h3>
                    <span className="text-4xl font-extrabold text-slate-800">{store.rwList.length}</span>
                  </div>
                  <p className="text-xxs text-slate-500 mt-4 font-semibold">Rukun Warga aktif dalam kepengurusan Dusun Sukamaju.</p>
                </div>
              </div>

              {/* Demografi Visualizations */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-800 tracking-tight">Statistik & Demografi Penduduk</h3>
                </div>
                <DashboardCharts 
                  wargaList={store.wargaList}
                  rwList={store.rwList}
                  mutasiList={store.mutasiList}
                  currentUser={store.currentUser}
                />
              </div>

              {/* Quick schedule lists / agendas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Ronda widget */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5 mb-4">
                    <ShieldAlert className="w-4 h-4 text-indigo-600" />
                    Ronda Malam Hari Ini
                  </h3>
                  
                  <div className="space-y-3">
                    {store.rondaList.filter(r => isAdmin || r.rwId === userRwId).slice(0, 3).map((ronda) => (
                      <div key={ronda.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-800">{ronda.hari} • {ronda.lokasiSektor}</p>
                          <p className="text-xxs text-slate-400 mt-0.5">Petugas: {ronda.wargaIds.length} warga siskamling</p>
                        </div>
                        <span className="text-xxs font-bold text-indigo-650 bg-indigo-50 py-1 px-2.5 rounded-lg">
                          {ronda.jamMulai} WIB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agendas widget */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5 mb-4">
                    <CalendarClock className="w-4.5 h-4.5 text-emerald-600" />
                    Agenda Menuju Minggu Ini
                  </h3>

                  <div className="space-y-3">
                    {store.kegiatanList.filter(g => isAdmin || g.rwId === userRwId).slice(0, 3).map((giat) => (
                      <div key={giat.id} className="p-3 bg-slate-50 rounded-xl relative border border-slate-100 text-xs">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-slate-800">{giat.nama}</span>
                          <span className="text-xxs text-slate-400 flex items-center gap-0.5"><Clock className="w-3 h-3" /> {giat.waktu}</span>
                        </div>
                        <p className="text-xxs text-slate-550 leading-relaxed font-medium">{giat.deskripsi}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-2 inline-flex items-center gap-0.5">
                          <MapPin className="w-3.5 h-3.5" /> Lokasi: {giat.lokasi}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Photo Gallery Widget Section */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xxs transition-colors">
                <DashboardGallery 
                  galleryPhotos={store.galleryPhotos}
                  onAddPhoto={store.addGalleryPhoto}
                  onEditPhoto={store.editGalleryPhoto}
                  onRemovePhoto={store.removeGalleryPhoto}
                  isAdmin={isAdmin}
                  reporterName={store.currentUser?.nama || 'Kepala Dusun'}
                />
              </div>
            </div>
          )}

          {activeTab === 'warga' && (
            <WargaTab 
              currentUser={store.currentUser}
              wargaList={store.wargaList}
              rwList={store.rwList}
              mutasiList={store.mutasiList}
              onAddWarga={store.addWarga}
              onAddWargaBulk={store.addWargaBulk}
              onEditWarga={store.editWarga}
              onRemoveWarga={store.removeWarga}
              onRemoveWargaBulk={store.removeWargaBulk}
              onRestoreWargaBackup={store.restoreWargaBackup}
            />
          )}

          {activeTab === 'iuran' && (
            <IuranTab 
              currentUser={store.currentUser}
              wargaList={store.wargaList}
              iuranList={store.iuranList}
              transaksiList={store.transaksiList}
              onAddIuranRecord={store.addIuranRecord}
              onPayIuran={store.payIuran}
              onAddTransaksi={store.addTransaksi}
            />
          )}

          {activeTab === 'bansos' && (
            <BansosTab 
              currentUser={store.currentUser}
              wargaList={store.wargaList}
              pengajuanList={store.pengajuanList}
              onAddPengajuan={store.addPengajuan}
              onUpdateStatus={store.updatePengajuanStatus}
            />
          )}

          {activeTab === 'penerima' && (
            <PenerimaTab 
              currentUser={store.currentUser}
              wargaList={store.wargaList}
              rwList={store.rwList}
              penerimaBantuanList={store.penerimaBantuanList}
              onAddPenerimaBantuan={store.addPenerimaBantuan}
              onEditPenerimaBantuan={store.editPenerimaBantuan}
              onRemovePenerimaBantuan={store.removePenerimaBantuan}
            />
          )}

          {activeTab === 'laporan' && (
            <LaporanTab 
              currentUser={store.currentUser}
              wargaList={store.wargaList}
              laporanList={store.laporanList}
              onAddLaporan={store.addLaporan}
              onUpdateStatus={store.updateLaporanStatus}
            />
          )}

          {activeTab === 'agenda' && (
            <AgendaTab 
              currentUser={store.currentUser}
              wargaList={store.wargaList}
              rondaList={store.rondaList}
              kegiatanList={store.kegiatanList}
              onAddRonda={store.addRonda}
              onRemoveRonda={store.removeRonda}
              onAddKegiatan={store.addKegiatan}
              onRemoveKegiatan={store.removeKegiatan}
            />
          )}

        </main>
      </div>

      {/* Elegant footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 py-6 text-xs text-center mt-12 bg-cover bg-center">
        <p className="font-bold text-slate-400">© 2026 Dusun Sukamaju Mandiri - Dukung Kependudukan & PWA Offline-First</p>
        <p className="text-slate-650 mt-1.5 font-medium">Bekerjasama dengan Otoritas RT/RW Setempat Melalui Firebase Cloud Engine</p>
      </footer>
    </div>
  );
}
