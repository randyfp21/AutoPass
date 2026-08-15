import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Car, Bike, AlertCircle, Sparkles, Camera, Upload, Trash2, ShieldAlert } from 'lucide-react';
import type { CreateVehicleData, VehicleCategory, Vehicle } from '../../types';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVehicleData) => Promise<void>;
  initialData?: Vehicle | null;
}

interface FormErrors {
  license_plate?: string;
  brand?: string;
  model?: string;
  manufacture_year?: string;
  current_mileage?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

const POPULAR_BRANDS_MOBIL = ['Toyota', 'Honda', 'Suzuki', 'Mitsubishi', 'Daihatsu', 'Nissan', 'Hyundai', 'BMW', 'Mercedes-Benz', 'Wuling', 'Chery'];
const POPULAR_BRANDS_MOTOR = ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'TVS', 'Bajaj', 'Royal Enfield', 'Harley-Davidson'];

const GENZ_NICKNAMES_MOBIL = [
  'Black Mamba',
  'Zenix Prime',
  'Si Merah',
  'Silver Surfer',
  'Iron Horse',
  'Si Whitey',
];

const GENZ_NICKNAMES_MOTOR = [
  'Mio Smile',
  'Vario Hedon',
  'Si Blacky',
  'NMAX Starboy',
  'Vespa Cantik',
  'Beat Karbu Legend',
];

// ─── Image Compression Helper ─────────────────────────────────────────────────

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
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
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddVehicleModal({ isOpen, onClose, onSubmit, initialData }: AddVehicleModalProps) {
  const [nickname, setNickname] = useState('');
  const [category, setCategory] = useState<VehicleCategory>('mobil');
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [year, setYear] = useState<number>(currentYear);
  const [mileage, setMileage] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // STNK Information States
  const [stnkNumber, setStnkNumber] = useState('');
  const [stnkExpiryDate, setStnkExpiryDate] = useState('');

  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form state when modal opens with initialData or resets
  useEffect(() => {
    if (isOpen && initialData) {
      setNickname(initialData.nickname || '');
      setCategory(initialData.category || 'mobil');
      setLicensePlate(initialData.license_plate || '');
      setBrand(initialData.brand || '');
      setModel(initialData.model || '');
      setVariant(initialData.variant_type || '');
      setYear(initialData.manufacture_year || currentYear);
      setMileage(initialData.current_mileage !== undefined ? String(initialData.current_mileage) : '');
      setPhotoUrl(initialData.photo_url || '');
      setStnkNumber(initialData.stnk_number || '');
      setStnkExpiryDate(initialData.stnk_expiry_date || '');
      setErrors({});
      setGlobalError('');
    } else if (!isOpen) {
      setNickname('');
      setCategory('mobil');
      setLicensePlate('');
      setBrand('');
      setModel('');
      setVariant('');
      setYear(currentYear);
      setMileage('');
      setPhotoUrl('');
      setStnkNumber('');
      setStnkExpiryDate('');
      setErrors({});
      setGlobalError('');
    }
  }, [isOpen, initialData]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setGlobalError('File harus berupa gambar (JPG, PNG, WEBP)');
      return;
    }

    setIsProcessingPhoto(true);
    try {
      const dataUrl = await compressImage(file);
      setPhotoUrl(dataUrl);
      setGlobalError('');
    } catch (err) {
      console.error(err);
      setGlobalError('Gagal memproses foto kendaraan');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!licensePlate.trim()) {
      newErrors.license_plate = 'Plat nomor wajib diisi';
    } else if (licensePlate.trim().length < 4) {
      newErrors.license_plate = 'Plat nomor tidak valid';
    }

    if (!brand.trim()) {
      newErrors.brand = 'Merek wajib diisi';
    }

    if (!model.trim()) {
      newErrors.model = 'Model wajib diisi';
    }

    const mileageNum = Number(mileage);
    if (!mileage) {
      newErrors.current_mileage = 'Kilometer saat ini wajib diisi';
    } else if (isNaN(mileageNum) || mileageNum < 0) {
      newErrors.current_mileage = 'Kilometer harus berupa angka positif';
    } else if (mileageNum > 9999999) {
      newErrors.current_mileage = 'Kilometer terlalu besar';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      await onSubmit({
        nickname: nickname.trim() || undefined,
        category,
        license_plate: licensePlate.trim().toUpperCase(),
        brand: brand.trim(),
        model: model.trim(),
        variant_type: variant.trim() || undefined,
        manufacture_year: year,
        current_mileage: Number(mileage),
        photo_url: photoUrl || undefined,
        stnk_number: stnkNumber.trim() || undefined,
        stnk_expiry_date: stnkExpiryDate || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menambah kendaraan';
      setGlobalError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const popularBrands = category === 'mobil' ? POPULAR_BRANDS_MOBIL : POPULAR_BRANDS_MOTOR;
  const nicknamePresets = category === 'mobil' ? GENZ_NICKNAMES_MOBIL : GENZ_NICKNAMES_MOTOR;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Data Kendaraan' : 'Tambah Kendaraan'}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button
            type="submit"
            form="add-vehicle-form"
            isLoading={isLoading}
          >
            {initialData ? 'Simpan Perubahan' : 'Tambah Kendaraan'}
          </Button>
        </div>
      }
    >
      <form id="add-vehicle-form" onSubmit={handleSubmit} className="space-y-5">
        {/* ── Photo Upload Zone ── */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center justify-between">
            <span>Foto Kendaraan</span>
            <span className="text-xs text-slate-400 font-normal">Tersimpan ke Database</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {photoUrl ? (
            <div className="relative h-44 rounded-2xl overflow-hidden border-2 border-blue-500 group shadow-sm">
              <img src={photoUrl} alt="Preview Kendaraan" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-slate-800 p-2.5 rounded-full text-xs font-bold shadow hover:bg-slate-100 flex items-center gap-1.5 px-3"
                >
                  <Camera size={15} /> Ubah Foto
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="bg-red-600 text-white p-2.5 rounded-full text-xs font-bold shadow hover:bg-red-700 flex items-center gap-1.5 px-3"
                >
                  <Trash2 size={15} /> Hapus
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                {isProcessingPhoto ? (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload size={22} />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {isProcessingPhoto ? 'Memproses gambar...' : 'Klik untuk Upload Foto Kendaraan'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Format JPG, PNG, WEBP (Otomatis Dioptimasi & Simpan ke DB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Category Toggle ── */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Jenis Kendaraan
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { value: 'mobil' as VehicleCategory, label: 'Mobil', icon: <Car size={22} /> },
                { value: 'motor' as VehicleCategory, label: 'Motor', icon: <Bike size={22} /> },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setCategory(opt.value);
                  setBrand('');
                }}
                className={[
                  'flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all font-medium',
                  category === opt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                ].join(' ')}
              >
                <span
                  className={category === opt.value ? 'text-blue-600' : 'text-slate-400'}
                >
                  {opt.icon}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Nickname Ala Gen Z ── */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-2xl border border-purple-150 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles size={15} className="text-purple-600 animate-pulse" />
              Nama Panggilan / Nickname (Ala Gen Z ✨)
            </label>
            <span className="text-[10px] text-purple-600 font-semibold bg-purple-100 px-2 py-0.5 rounded-full">
              Keren & Estetik
            </span>
          </div>

          <input
            type="text"
            className="input-field text-xs bg-white border-purple-200 focus:border-purple-500 font-semibold"
            placeholder='Contoh: "Black Mamba", "Mio Smile", "Si Merah", "Zenix Prime"'
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />

          {/* Preset Suggestions */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Inspirasi Panggilan Keren:</p>
            <div className="flex flex-wrap gap-1.5">
              {nicknamePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNickname(preset)}
                  className="text-[11px] bg-white hover:bg-purple-600 hover:text-white text-purple-700 font-bold px-2.5 py-1 rounded-lg border border-purple-200 transition-all shadow-2xs"
                >
                  ✨ {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── STNK Information (Nomor STNK & Masa Berlaku / Expired Date) ── */}
        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <ShieldAlert size={16} className="text-amber-600" />
              Informasi STNK & Pajak Kendaraan
            </label>
            <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
              Pengingat Otomatis 90 Hari
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor STNK / Registrasi (Opsional)
              </label>
              <input
                type="text"
                className="input-field text-xs uppercase bg-white border-amber-200 focus:border-amber-500 font-mono"
                placeholder="Contoh: 12345678/SKUM/2025"
                value={stnkNumber}
                onChange={(e) => setStnkNumber(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Masa Berlaku STNK / Pajak
              </label>
              <input
                type="date"
                className="input-field text-xs bg-white border-amber-200 focus:border-amber-500 font-semibold text-slate-800"
                value={stnkExpiryDate}
                onChange={(e) => setStnkExpiryDate(e.target.value)}
              />
            </div>
          </div>
          <p className="text-[11px] text-amber-800/80">
            💡 Dashboard akan otomatis menampilkan peringatan jika masa berlaku STNK tersisa 3 bulan (90 hari) atau kurang.
          </p>
        </div>

        {/* ── License Plate ── */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Plat Nomor <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={`input-field uppercase tracking-widest ${errors.license_plate ? 'error' : ''}`}
            placeholder="B 1234 ABC"
            value={licensePlate}
            onChange={(e) => {
              setLicensePlate(e.target.value.toUpperCase());
              if (errors.license_plate) setErrors((p) => ({ ...p, license_plate: undefined }));
            }}
            maxLength={12}
            style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}
          />
          {errors.license_plate && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.license_plate}
            </p>
          )}
        </div>

        {/* ── Brand ── */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Merek <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={`input-field ${errors.brand ? 'error' : ''}`}
            placeholder="Contoh: Toyota, Honda, Yamaha"
            value={brand}
            list="brand-suggestions"
            onChange={(e) => {
              setBrand(e.target.value);
              if (errors.brand) setErrors((p) => ({ ...p, brand: undefined }));
            }}
          />
          <datalist id="brand-suggestions">
            {popularBrands.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
          {errors.brand && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.brand}
            </p>
          )}
        </div>

        {/* ── Model + Variant ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`input-field ${errors.model ? 'error' : ''}`}
              placeholder="Avanza, Vario, dll"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                if (errors.model) setErrors((p) => ({ ...p, model: undefined }));
              }}
            />
            {errors.model && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.model}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Varian <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="1.3 G MT, 150cc, dll"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
            />
          </div>
        </div>

        {/* ── Year + Mileage ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tahun Produksi <span className="text-red-500">*</span>
            </label>
            <select
              className="input-field"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Kilometer Saat Ini <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                className={`input-field pr-10 ${errors.current_mileage ? 'error' : ''}`}
                placeholder="0"
                value={mileage}
                min={0}
                onChange={(e) => {
                  setMileage(e.target.value);
                  if (errors.current_mileage) setErrors((p) => ({ ...p, current_mileage: undefined }));
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                km
              </span>
            </div>
            {errors.current_mileage && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.current_mileage}
              </p>
            )}
          </div>
        </div>

        {/* Global Error */}
        {globalError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {globalError}
          </div>
        )}
      </form>
    </Modal>
  );
}

export default AddVehicleModal;
