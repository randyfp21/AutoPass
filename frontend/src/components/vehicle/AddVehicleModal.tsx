import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Car, Bike, AlertCircle, Sparkles, Camera, Upload, Trash2, ShieldAlert, Fuel, Zap } from 'lucide-react';
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

const POPULAR_BRANDS_MOBIL = ['Toyota', 'Honda', 'Suzuki', 'Mitsubishi', 'Daihatsu', 'Nissan', 'Hyundai', 'BMW', 'Mercedes-Benz', 'Wuling', 'Chery', 'BYD'];
const POPULAR_BRANDS_MOTOR = ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'TVS', 'Bajaj', 'Royal Enfield', 'Harley-Davidson', 'Vespa', 'Niu', 'Gesits'];

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
  const [fuelType, setFuelType] = useState<'bensin' | 'ev'>('bensin');
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
      setFuelType(initialData.fuel_type === 'ev' ? 'ev' : 'bensin');
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
      setFuelType('bensin');
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
    if (!validate()) return;

    setIsLoading(true);
    setGlobalError('');

    try {
      const data: CreateVehicleData = {
        nickname: nickname.trim() || undefined,
        category,
        fuel_type: fuelType,
        license_plate: licensePlate.trim().toUpperCase(),
        brand: brand.trim(),
        model: model.trim(),
        variant_type: variant.trim() || undefined,
        manufacture_year: year,
        current_mileage: Number(mileage),
        photo_url: photoUrl || undefined,
        stnk_number: stnkNumber.trim() || undefined,
        stnk_expiry_date: stnkExpiryDate || undefined,
      };
      await onSubmit(data);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan kendaraan';
      setGlobalError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const popularBrands = category === 'mobil' ? POPULAR_BRANDS_MOBIL : POPULAR_BRANDS_MOTOR;

  const handleGenerateGenZNickname = () => {
    const list = category === 'mobil' ? GENZ_NICKNAMES_MOBIL : GENZ_NICKNAMES_MOTOR;
    const random = list[Math.floor(Math.random() * list.length)];
    setNickname(random);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Data Kendaraan' : 'Tambah Kendaraan Baru'}
      size="md"
      footer={
        <div className="flex justify-end gap-3 w-full">
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
        {/* Global Error Banner */}
        {globalError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        {/* ── Photo Upload Section ── */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Foto Kendaraan
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          {photoUrl ? (
            <div className="relative h-44 rounded-2xl overflow-hidden border-2 border-blue-500 group shadow-sm">
              <img src={photoUrl} alt="Preview Kendaraan" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-slate-800 p-2.5 rounded-full text-xs font-bold shadow hover:bg-slate-100 flex items-center gap-1.5 px-3 cursor-pointer"
                >
                  <Camera size={15} /> Ubah Foto
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="bg-red-600 text-white p-2.5 rounded-full text-xs font-bold shadow hover:bg-red-700 flex items-center gap-1.5 px-3 cursor-pointer"
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
                  'flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all font-medium cursor-pointer',
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

        {/* ── Fuel Type Interactive Slider Switch ── */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Tipe Bahan Bakar / Sumber Daya
          </label>
          <div className="relative p-1 bg-slate-200/80 rounded-2xl flex items-center shadow-inner cursor-pointer select-none">
            {/* Animated Slider Highlight background */}
            <div
              className={[
                'absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl transition-all duration-300 shadow-md',
                fuelType === 'ev'
                  ? 'left-[calc(50%+2px)] bg-gradient-to-r from-emerald-500 to-teal-600'
                  : 'left-1 bg-gradient-to-r from-amber-500 to-orange-600',
              ].join(' ')}
            />

            <button
              type="button"
              onClick={() => setFuelType('bensin')}
              className={[
                'relative z-10 flex-1 py-3 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer',
                fuelType === 'bensin' ? 'text-white' : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              <Fuel size={16} />
              <span>⛽ Bensin / BBM</span>
            </button>

            <button
              type="button"
              onClick={() => setFuelType('ev')}
              className={[
                'relative z-10 flex-1 py-3 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer',
                fuelType === 'ev' ? 'text-white' : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              <Zap size={16} />
              <span>⚡ Kendaraan Listrik (EV)</span>
            </button>
          </div>
        </div>

        {/* ── Nickname Field (Optional GenZ Feature) ── */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Nama Panggilan / Nickname (Opsional)
            </label>

            <button
              type="button"
              onClick={handleGenerateGenZNickname}
              className="text-[11px] font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span>Acak Gen-Z</span>
            </button>
          </div>

          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Contoh: Si Merah, Zenix Prime, Starboy"
            className="input-field"
          />
        </div>

        {/* ── License Plate Field ── */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Plat Nomor <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={licensePlate}
            onChange={(e) => {
              setLicensePlate(e.target.value.toUpperCase());
              if (errors.license_plate) {
                setErrors((prev) => ({ ...prev, license_plate: undefined }));
              }
            }}
            placeholder="Contoh: B 1234 ABC"
            className={[
              'input-field font-mono font-bold tracking-widest uppercase text-base',
              errors.license_plate ? 'border-red-500 focus:border-red-500' : '',
            ].join(' ')}
          />
          {errors.license_plate && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle size={13} />
              {errors.license_plate}
            </p>
          )}
        </div>

        {/* ── Brand Field ── */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Merek Kendaraan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              if (errors.brand) {
                setErrors((prev) => ({ ...prev, brand: undefined }));
              }
            }}
            placeholder={category === 'mobil' ? 'Contoh: Toyota, Honda' : 'Contoh: Honda, Yamaha'}
            className={[
              'input-field mb-2',
              errors.brand ? 'border-red-500 focus:border-red-500' : '',
            ].join(' ')}
          />
          {errors.brand && (
            <p className="mb-2 text-xs text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle size={13} />
              {errors.brand}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {popularBrands.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => {
                  setBrand(b);
                  if (errors.brand) {
                    setErrors((prev) => ({ ...prev, brand: undefined }));
                  }
                }}
                className={[
                  'px-2.5 py-1 text-xs rounded-lg border transition-all font-medium cursor-pointer',
                  brand === b
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                ].join(' ')}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* ── Model & Variant Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                if (errors.model) {
                  setErrors((prev) => ({ ...prev, model: undefined }));
                }
              }}
              placeholder={category === 'mobil' ? 'Contoh: Avanza, Civic' : 'Contoh: NMAX, Beat'}
              className={[
                'input-field',
                errors.model ? 'border-red-500 focus:border-red-500' : '',
              ].join(' ')}
            />
            {errors.model && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
                <AlertCircle size={13} />
                {errors.model}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Varian / Tipe (Opsional)
            </label>
            <input
              type="text"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              placeholder="Contoh: 1.5 G CVT, Connected"
              className="input-field"
            />
          </div>
        </div>

        {/* ── Year & Mileage Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tahun Pembuatan <span className="text-red-500">*</span>
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="input-field bg-white"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Odometer KM Terakhir <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={mileage}
              onChange={(e) => {
                setMileage(e.target.value);
                if (errors.current_mileage) {
                  setErrors((prev) => ({ ...prev, current_mileage: undefined }));
                }
              }}
              placeholder="Contoh: 45000"
              min="0"
              step="1"
              className={[
                'input-field',
                errors.current_mileage ? 'border-red-500 focus:border-red-500' : '',
              ].join(' ')}
            />
            {errors.current_mileage && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
                <AlertCircle size={13} />
                {errors.current_mileage}
              </p>
            )}
          </div>
        </div>

        {/* ── STNK Information Section ── */}
        <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-blue-600 shrink-0" />
            <h4 className="text-xs font-extrabold text-slate-800">
              Informasi STNK & Pajak Kendaraan (Opsional)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Nomor STNK / BPKB
              </label>
              <input
                type="text"
                value={stnkNumber}
                onChange={(e) => setStnkNumber(e.target.value.toUpperCase())}
                placeholder="Contoh: 12345678/STNK/2024"
                className="input-field text-xs font-mono uppercase bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tanggal Jatuh Tempo Pajak (STNK)
              </label>
              <input
                type="date"
                value={stnkExpiryDate}
                onChange={(e) => setStnkExpiryDate(e.target.value)}
                className="input-field text-xs bg-white"
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default AddVehicleModal;
