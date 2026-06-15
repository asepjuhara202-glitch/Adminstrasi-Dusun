import React, { useState } from 'react';
import { User } from '../types';
import { INITIAL_RWS } from '../lib/mockData';
import { Shield, Users, User as UserIcon, Check, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  currentUser: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
}

export function LoginModal({ currentUser, onLogin, onLogout }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Expanded precise presets with user-defined credentials
  const presetUsers = [
    { id: 'admin', username: 'admin', password: 'adminpassword', nama: 'Pak Asep Juhara', role: 'Admin' as const, desc: 'Kepala Dusun (Akses Penuh Seluruh Wilayah)' },
    { id: 'rw07', username: 'rw07', password: 'rw07m', nama: 'Pak Miftah (RW 07)', role: 'User' as const, rwId: 'RW 07', desc: 'Ketua RW 07' },
    { id: 'rw08', username: 'rw08', password: 'rw08d', nama: 'Pak Darmatin (RW 08)', role: 'User' as const, rwId: 'RW 08', desc: 'Ketua RW 08' },
    { id: 'rw09', username: 'rw09', password: 'rw09s', nama: 'Pak Sulam (RW 09)', role: 'User' as const, rwId: 'RW 09', desc: 'Ketua RW 09' },
    { id: 'rw13', username: 'rw13', password: 'rw13a', nama: 'Pak Ajang (RW 13)', role: 'User' as const, rwId: 'RW 13', desc: 'Ketua RW 13' },
    { id: 'rw15', username: 'rw15', password: 'rw15f', nama: 'Pak Fuad (RW 15)', role: 'User' as const, rwId: 'RW 15', desc: 'Ketua RW 15' },
    { id: 'rw16', username: 'rw16', password: 'rw16e', nama: 'Pak Endang (RW 16)', role: 'User' as const, rwId: 'RW 16', desc: 'Ketua RW 16' },
    { id: 'rw17', username: 'rw17', password: 'rw17j', nama: 'Pak Jajang (RW 17)', role: 'User' as const, rwId: 'RW 17', desc: 'Ketua RW 17' }
  ];

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const foundU = presetUsers.find(
      u => u.username === username.trim().toLowerCase() && u.password === password
    );

    if (foundU) {
      onLogin({
        id: foundU.id,
        username: foundU.username,
        nama: foundU.nama,
        role: foundU.role,
        rwId: foundU.rwId
      });
      // Reset form
      setUsername('');
      setPassword('');
    } else {
      setErrorMsg('Username atau Password salah! Silakan coba lagi atau klik akun cepat di bawah.');
    }
  };

  const autofillUser = (user: typeof presetUsers[0]) => {
    setUsername(user.username);
    setPassword(user.password);
    setErrorMsg(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-md w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Otentikasi Wilayah</h2>
          <p className="text-xs text-slate-500">Gunakan Akun Kadus / Ketua RW Wilayah Anda</p>
        </div>
      </div>

      {currentUser ? (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-1">Masuk Sebagai</p>
            <p className="font-bold text-slate-800 text-lg">{currentUser.nama}</p>
            <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              currentUser.role === 'Admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
            }`}>
              <Shield className="w-3.5 h-3.5" />
              {currentUser.role === 'Admin' ? 'Kepala Dusun (Admin)' : `Ketua ${currentUser.rwId} (User)`}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            Keluar Otorisasi
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-start gap-2.5 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Secure Login Form */}
          <form onSubmit={handleFormLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Nama Pengguna (Username)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cth. admin atau rw01"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Kata Sandi (Password)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-xs cursor-pointer"
            >
              Masuk Sistem
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase tracking-wider font-bold">Kemudahan Akses Uji Coba</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Quick Click & Autofill Accents */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Akun Instan (Klik untuk Autofill):</p>
            {presetUsers.map((user) => (
              <button
                type="button"
                key={user.id}
                onClick={() => autofillUser(user)}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-indigo-150 hover:bg-indigo-50/20 transition flex items-start justify-between gap-2.5 group cursor-pointer"
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg mt-0.5 ${
                    user.role === 'Admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {user.role === 'Admin' ? <Shield className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-xs transition group-hover:text-indigo-600">{user.nama}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      U: <span className="font-mono text-indigo-600 font-bold bg-slate-50 px-1 py-0.5 rounded mr-1.5">{user.username}</span> 
                      P: <span className="font-mono text-slate-600 font-extrabold bg-slate-50 px-1 py-0.5 rounded">{user.password}</span>
                    </p>
                  </div>
                </div>
                {username === user.username && password === user.password && (
                  <Check className="w-4 h-4 text-emerald-500 self-center shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
