import React, { useState } from 'react';
import { GalleryPhoto } from '../types';
import { Camera, Image as ImageIcon, Calendar, User, Trash2, Plus, X, Tag, Heart, Eye } from 'lucide-react';

interface DashboardGalleryProps {
  galleryPhotos: GalleryPhoto[];
  onAddPhoto: (photo: Omit<GalleryPhoto, 'id' | 'date'>) => Promise<void>;
  onEditPhoto: (id: number, edits: Partial<GalleryPhoto>) => Promise<void>;
  onRemovePhoto: (id: number) => Promise<void>;
  isAdmin: boolean;
  reporterName: string;
}

// Preset photo options to make adding super easy and high quality without searching for URLs
const PRESET_PHOTOS = [
  {
    name: 'Gotong Royong Mencegah Banjir',
    url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=800',
    category: 'Gotong Royong'
  },
  {
    name: 'Posyandu Ibu & Balita Sehat',
    url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800',
    category: 'Posyandu'
  },
  {
    name: 'Malam Siskamling & Keamanan',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800',
    category: 'Siskamling'
  },
  {
    name: 'Penyaluran BLT & Bansos Mandiri',
    url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800',
    category: 'Pemberian Bansos'
  },
  {
    name: 'Seni Musik Tradisional & Pentas Tari',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
    category: 'Kegiatan Desa'
  },
  {
    name: 'Rapat Persiapan HUT RI Desa',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
    category: 'Kegiatan Desa'
  }
];

export function DashboardGallery({
  galleryPhotos,
  onAddPhoto,
  onEditPhoto,
  onRemovePhoto,
  isAdmin,
  reporterName
}: DashboardGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  
  // Show Add Photo Modal
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form States
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<GalleryPhoto['category']>('Gotong Royong');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [formCustomUrl, setFormCustomUrl] = useState('');
  const [useCustomUrl, setUseCustomUrl] = useState(false);

  const categories = ['ALL', 'Gotong Royong', 'Pemberian Bansos', 'Siskamling', 'Posyandu', 'Kegiatan Desa'];

  const filteredPhotos = galleryPhotos.filter(p => {
    if (activeCategory === 'ALL') return true;
    return p.category === activeCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      alert('Harap isi semua kolom judul dan deskripsi!');
      return;
    }

    const finalUrl = useCustomUrl 
      ? (formCustomUrl.trim() || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=800')
      : PRESET_PHOTOS[selectedPresetIndex].url;

    await onAddPhoto({
      title: formTitle,
      description: formDescription,
      imageUrl: finalUrl,
      category: formCategory,
      reporter: reporterName || 'Kepala Dusun'
    });

    // Reset Form
    setFormTitle('');
    setFormDescription('');
    setFormCustomUrl('');
    setUseCustomUrl(false);
    setSelectedPresetIndex(0);
    setShowAddModal(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Avoid triggering full pre-view modal
    if (confirm('Apakah Anda yakin ingin menghapus foto kegiatan ini dari galeri?')) {
      await onRemovePhoto(id);
    }
  };

  return (
    <div className="space-y-6" id="dashboard-gallery-section">
      {/* Title & Add Action bar */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Galeri Foto Kegiatan Dusun
          </h3>
          <p className="text-slate-400 text-xxs font-medium mt-0.5">Dokumentasi momen gotong royong dan kemajuan warga Sukamaju Mandiri</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          type="button"
          className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xxs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Unggah Foto
        </button>
      </div>

      {/* Category Pills Slider */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`py-1.5 px-3 rounded-lg text-xxs font-bold transition whitespace-nowrap cursor-pointer ${
              activeCategory === cat
                ? 'bg-indigo-650 text-white shadow-xxs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat === 'ALL' ? 'Semua Momen' : cat}
          </button>
        ))}
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xxs hover:shadow-md transition-all duration-300 group cursor-pointer flex flex-col h-full"
            >
              {/* Image Container with category overlay */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="inline-flex items-center gap-1 py-1 px-2.5 bg-slate-950/70 backdrop-blur-md rounded-lg text-[9px] font-extrabold uppercase text-white tracking-wider">
                    <Tag className="w-2.5 h-2.5 text-indigo-400" />
                    {photo.category}
                  </span>
                </div>

                {/* Hover overlay zooming view eye banner */}
                <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="p-2.5 bg-white/90 backdrop-blur-xs text-indigo-600 rounded-full shadow-md scale-90 group-hover:scale-100 transition-transform">
                    <Eye className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Photo metadata body */}
              <div className="p-4 flex flex-col justify-between flex-grow">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 leading-normal">
                    {photo.title}
                  </h4>
                  <p className="text-xxs text-slate-500 mt-1 lines-2 leading-relaxed">
                    {photo.description}
                  </p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/60 mt-3 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-semibold font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-350" />
                    {photo.date}
                  </span>
                  
                  {/* Delete button if user has permission */}
                  {(isAdmin || photo.reporter === reporterName) ? (
                    <button
                      onClick={(e) => handleDelete(e, photo.id)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 rounded-lg transition-colors cursor-pointer"
                      title="Hapus foto dari galeri"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="flex items-center gap-0.5 max-w-[120px] truncate" title={`Oleh: ${photo.reporter}`}>
                      <User className="w-3 h-3 text-slate-350 shrink-0" />
                      {photo.reporter}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-12 text-center text-slate-400 transition-colors">
          <ImageIcon className="w-10 h-10 mx-auto stroke-1 text-slate-350 mb-2" />
          <p className="text-xs font-bold text-slate-500">Galeri Foto Kosong</p>
          <p className="text-xxs text-slate-400 mt-0.5">Belum ada dokumentasi untuk momen "{activeCategory}".</p>
        </div>
      )}

      {/* ZOOM LIGHTBOX VIEW */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 bg-slate-950/70 dark:bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-white"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/10 max-w-2xl w-full overflow-hidden text-slate-900 dark:text-slate-100 shadow-2xl relative"
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2.5 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md hover:bg-slate-950 text-white rounded-full z-10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative aspect-[16/10] w-full bg-slate-950">
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="py-1 px-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                  {selectedPhoto.category}
                </span>
                <span className="flex items-center gap-1 text-xxs font-semibold font-mono text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {selectedPhoto.date}
                </span>
                <span className="flex items-center gap-1 text-xxs font-semibold font-mono text-slate-400 ml-auto">
                  <User className="w-3.5 h-3.5" />
                  Oleh: {selectedPhoto.reporter}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-normal">
                {selectedPhoto.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mt-2 font-medium">
                {selectedPhoto.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD PHOTO MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 transition-colors">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-500" />
                Unggah Dokumentasi Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 dark:text-slate-450 mb-1">Judul Kegiatan / Momen</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="cth: Bazar Ramadan Pemuda RT 02"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 dark:text-slate-450 mb-1">Kategori Dokumentasi</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    required
                  >
                    <option value="Gotong Royong">Gotong Royong</option>
                    <option value="Pemberian Bansos">Pemberian Bansos</option>
                    <option value="Siskamling">Siskamling</option>
                    <option value="Posyandu">Posyandu</option>
                    <option value="Kegiatan Desa">Kegiatan Desa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-450 mb-1">Metode Memasukkan Foto</label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setUseCustomUrl(false)}
                      className={`flex-1 py-1.5 text-center rounded-md font-bold transition-all text-[10px] cursor-pointer ${
                        !useCustomUrl ? 'bg-white dark:bg-slate-700 text-indigo-650' : 'text-slate-400'
                      }`}
                    >
                      Pilih Preset Terpilih
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseCustomUrl(true)}
                      className={`flex-1 py-1.5 text-center rounded-md font-bold transition-all text-[10px] cursor-pointer ${
                        useCustomUrl ? 'bg-white dark:bg-slate-700 text-indigo-650' : 'text-slate-400'
                      }`}
                    >
                      Tulis Link Custom
                    </button>
                  </div>
                </div>
              </div>

              {/* Source selections */}
              {useCustomUrl ? (
                <div>
                  <label className="block text-slate-500 dark:text-slate-450 mb-1">URL / Link Foto Custom</label>
                  <input
                    type="url"
                    value={formCustomUrl}
                    onChange={(e) => setFormCustomUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Gunakan link gambar Unsplash, Picsum, atau hosting publik berspesifikasi tinggi lainnya.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-500 dark:text-slate-450 mb-1">Pilih Gambar Ilustrasi Preset Sesuai Topik</label>
                  <div className="grid grid-cols-3 gap-2.5 mt-1">
                    {PRESET_PHOTOS.map((preset, idx) => (
                      <div
                        key={preset.name}
                        onClick={() => {
                          setSelectedPresetIndex(idx);
                          setFormCategory(preset.category as any);
                        }}
                        className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition ${
                          selectedPresetIndex === idx ? 'border-indigo-600 scale-95 shadow-md' : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 p-1 text-center">
                          <span className="text-[8px] text-white line-clamp-1 block">{preset.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-500 dark:text-slate-450 mb-1">Deskripsi & Catatan Dokumentasi</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  required
                  placeholder="Ceritakan sejarah dibalik foto kegiatan ini secara singkat..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 leading-normal"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-150 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-550 dark:text-slate-400 cursor-pointer text-xxs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer text-xxs font-bold"
                >
                  Unggah Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
