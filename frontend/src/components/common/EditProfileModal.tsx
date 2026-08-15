import React, { useState, useRef } from 'react';
import { User, Mail, Camera, Trash2, AlertCircle, Check, FileText } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import type { User as UserType } from '../../types';
import { authService } from '../../services/authService';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onProfileUpdated: (updatedUser: UserType) => void;
}

function compressAvatarImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressed);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const COUNTRY_CODES = [
  { code: '+62', flag: '🇮🇩', label: 'Indonesia (+62)' },
  { code: '+60', flag: '🇲🇾', label: 'Malaysia (+60)' },
  { code: '+65', flag: '🇸🇬', label: 'Singapore (+65)' },
  { code: '+1', flag: '🇺🇸', label: 'United States (+1)' },
  { code: '+61', flag: '🇦🇺', label: 'Australia (+61)' },
  { code: '+81', flag: '🇯🇵', label: 'Japan (+81)' },
];

export function EditProfileModal({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
}: EditProfileModalProps) {
  // Parse initial phone number into country code & digits
  const parsePhone = (rawPhone?: string) => {
    if (!rawPhone) return { code: '+62', digits: '' };
    for (const c of COUNTRY_CODES) {
      if (rawPhone.startsWith(c.code)) {
        return { code: c.code, digits: rawPhone.slice(c.code.length) };
      }
    }
    if (rawPhone.startsWith('0')) {
      return { code: '+62', digits: rawPhone.slice(1) };
    }
    return { code: '+62', digits: rawPhone };
  };

  const initialPhone = parsePhone(user.phone_number);

  const [fullName, setFullName] = useState(user.full_name || '');
  const [username, setUsername] = useState((user.username || '').replace(/^@/, ''));
  const [bio, setBio] = useState(user.bio || '');
  const [countryCode, setCountryCode] = useState(initialPhone.code);
  const [phoneDigits, setPhoneDigits] = useState(initialPhone.digits);
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatar_url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG/PNG/WebP)');
      return;
    }

    try {
      const compressed = await compressAvatarImage(file);
      setAvatarUrl(compressed);
      setError('');
    } catch (err) {
      console.error('Failed to compress avatar:', err);
      setError('Gagal memproses foto. Coba lagi.');
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Nama lengkap wajib diisi');
      return;
    }

    setIsLoading(true);
    setError('');

    const formattedPhone = phoneDigits.trim() ? `${countryCode}${phoneDigits.trim()}` : undefined;
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

    try {
      const updated = await authService.updateProfile({
        full_name: fullName.trim(),
        username: cleanUsername || undefined,
        phone_number: formattedPhone,
        avatar_url: avatarUrl || undefined,
        bio: bio.trim() || undefined,
      });

      onProfileUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Gagal memperbarui profil. Coba lagi.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="👤 Edit Profil Saya" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        )}

        {/* 2-Column Grid Layout (Kiri: Foto & Bio, Kanan: Identity Inputs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Kolom Kiri: Avatar Upload & Bio */}
          <div className="space-y-4 flex flex-col justify-between">
            {/* Avatar Upload Area */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-2xl flex items-center justify-center border-4 border-blue-100 shadow-md">
                    {getInitials(fullName || 'User')}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer"
                  title="Upload / Ubah Foto Profil"
                >
                  <Camera size={16} />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
              </div>

              <div className="flex items-center gap-2 mt-3 text-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  📷 Upload Foto
                </button>
                {avatarUrl && (
                  <>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="font-semibold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bio Textarea Input */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <FileText size={13} className="text-purple-600" />
                  Bio / Deskripsi Profil
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {bio.length}/160
                </span>
              </div>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                className="w-full flex-1 p-3 text-xs text-slate-800 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl outline-none resize-none placeholder:text-slate-400 min-h-[90px]"
                placeholder="Tulis deskripsi singkat tentang hobi otomotif, kendaraan impian, atau motto Anda..."
                maxLength={160}
              />
            </div>
          </div>

          {/* Kolom Kanan: Username, Nama Lengkap, Email, Phone */}
          <div className="space-y-3.5">
            {/* Username Input (@handle) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username (@handle)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-xs select-none">
                  @
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  className="input-field pl-7 text-xs font-mono font-extrabold text-purple-700 py-2"
                  placeholder="dnazrl"
                />
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Username unik profil Odo Threads
              </p>
            </div>

            {/* Full Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field pl-10 text-xs font-medium py-2"
                  placeholder="Nama lengkap Anda"
                />
              </div>
            </div>

            {/* Email Input (Read-only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email (Terverifikasi)
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="input-field pl-10 text-xs font-medium bg-slate-100 text-slate-500 cursor-not-allowed py-2"
                />
              </div>
            </div>

            {/* Phone Number Input with Country Code Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 bg-white">
                <div className="bg-slate-100 border-r border-slate-200 text-slate-700 font-extrabold text-xs px-2.5 py-2 flex items-center shrink-0">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 cursor-pointer outline-none text-xs"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="tel"
                  value={phoneDigits}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.startsWith('0')) val = val.slice(1);
                    setPhoneDigits(val);
                  }}
                  className="flex-1 py-2 px-3 text-xs font-medium border-0 focus:outline-none text-slate-900 placeholder:text-slate-400 font-mono"
                  placeholder="85780336399"
                />
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Ketik tanpa angka 0 (contoh: 85780336399)
              </p>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            leftIcon={<Check size={16} />}
          >
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default EditProfileModal;
