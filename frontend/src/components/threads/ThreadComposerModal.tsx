import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Image as ImageIcon, Camera, Trash2, Car, Sparkles, AlertCircle, Tag } from 'lucide-react';
import type { Vehicle, ThreadCategory } from '../../types';
import { threadsService } from '../../services/threadsService';

interface ThreadComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onThreadCreated: () => void;
}

export function ThreadComposerModal({
  isOpen,
  onClose,
  vehicles,
  onThreadCreated,
}: ThreadComposerModalProps) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ThreadCategory>('general');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photoUrls.length + files.length > 5) {
      setError('Maksimal 5 foto per thread post');
      return;
    }

    const fileArray = Array.from(files).slice(0, 5 - photoUrls.length);

    fileArray.forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPhotoUrls((prev) => [...prev, dataUrl].slice(0, 5));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Isi post thread tidak boleh kosong');
      return;
    }
    if (content.length > 1500) {
      setError('Isi post melebihi batas 1500 karakter');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await threadsService.createThread({
        content: content.trim(),
        category,
        vehicle_id: selectedVehicleId || undefined,
        photo_urls: photoUrls,
      });

      setContent('');
      setCategory('general');
      setSelectedVehicleId('');
      setPhotoUrls([]);
      onThreadCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memposting thread';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const charCount = content.length;
  const maxChars = 1500;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="💬 Posting Thread Otomotif Baru"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Category Dropdown Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Tag size={14} className="text-purple-600" />
            Kategori Topik Discussion:
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ThreadCategory)}
            className="input-field text-xs font-bold bg-slate-50 border-slate-200 py-2.5"
          >
            <option value="general">💬 Umum / Diskusi</option>
            <option value="kendala">🚨 Kendala / Trouble</option>
            <option value="pengalaman">✨ Sharing Pengalaman</option>
            <option value="tips">💡 Tips & Perawatan</option>
            <option value="trip">🗺️ Trip / Perjalanan</option>
            <option value="touring">🏍️ Touring / Sunmori</option>
            <option value="modifikasi">🛠️ Modifikasi & Aksesori</option>
          </select>
        </div>

        {/* Optional Vehicle Tag Selector (Privacy Protected: Category, Brand, Model & Variant ONLY) */}
        {vehicles.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Car size={13} className="text-purple-600" />
              Sematkan Spesifikasi Kendaraan (Privasi Terjaga):
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="input-field text-xs font-semibold bg-slate-50 border-slate-200 py-2"
            >
              <option value="">-- Tanpa Tag Kendaraan --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.category === 'mobil' ? '🚗 Mobil' : '🏍️ Motor'} · {v.brand} {v.model} {v.variant_type ? `(${v.variant_type})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Content Input Textarea */}
        <div className="relative">
          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bagikan kendala mesin, keluhan suku cadang, cerita trip/touring, hasil modifikasi, atau pengalamaan servis kamu..."
            className="w-full p-3.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-2xl outline-none resize-none"
            maxLength={maxChars}
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
            <span>Maksimal 1.500 Karakter</span>
            <span className={charCount > 1400 ? 'text-red-500 font-bold' : ''}>
              {charCount} / {maxChars}
            </span>
          </div>
        </div>

        {/* Photo Upload Previews (Max 5) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ImageIcon size={14} className="text-purple-600" />
              Foto / Media ({photoUrls.length}/5)
            </label>

            {photoUrls.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-purple-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Camera size={13} /> Tambah Foto
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoUpload}
          />

          {photoUrls.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {photoUrls.map((url, idx) => (
                <div key={idx} className="relative h-20 rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrls((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold cursor-pointer"
            leftIcon={<Sparkles size={15} />}
          >
            Post Thread
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ThreadComposerModal;
