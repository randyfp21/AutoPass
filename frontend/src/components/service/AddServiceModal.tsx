import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  Plus,
  Trash2,
  AlertCircle,
  Store,
  Wrench,
  ChevronDown,
  Camera,
  Upload,
} from 'lucide-react';
import type {
  CreateServiceRecordData,
  CreateServiceDetailData,
  MasterItem,
  VehicleCategory,
  Vehicle,
  ServicePlanner,
} from '../../types';
import { getMasterItems } from '../../services/maintenanceService';
import { formatRupiah } from '../../utils/formatters';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateServiceRecordData) => Promise<void>;
  vehicleCategory: VehicleCategory;
  currentMileage: number;
  vehicles?: Vehicle[];
  onVehicleChange?: (v: Vehicle) => void;
  initialPlanData?: ServicePlanner | null;
}

interface LineItem extends CreateServiceDetailData {
  _id: string; // local key
}

function newLineItem(): LineItem {
  return {
    _id: Math.random().toString(36).slice(2),
    item_name: '',
    quantity: 1,
    unit_price: 0,
    master_item_id: undefined,
  };
}

function compressReceiptImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
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
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
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

export function AddServiceModal({
  isOpen,
  onClose,
  onSubmit,
  vehicleCategory,
  currentMileage,
  vehicles,
  onVehicleChange,
  initialPlanData,
}: AddServiceModalProps) {
  const [workshopType, setWorkshopType] = useState<'official' | 'diy'>('diy');
  const [workshopName, setWorkshopName] = useState('');
  const [serviceDate, setServiceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [mileage, setMileage] = useState(String(currentMileage));
  const [complaints, setComplaints] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState<string>('');
  const [isProcessingReceiptPhoto, setIsProcessingReceiptPhoto] = useState(false);

  const [items, setItems] = useState<LineItem[]>([newLineItem()]);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMaster, setIsFetchingMaster] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const receiptFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch master items when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fetch = async () => {
      setIsFetchingMaster(true);
      try {
        const data = await getMasterItems(vehicleCategory);
        setMasterItems(data);
      } catch {
        // Silently fail
      } finally {
        setIsFetchingMaster(false);
      }
    };
    fetch();
  }, [isOpen, vehicleCategory]);

  // Sync form state when modal opens with initialPlanData or resets
  useEffect(() => {
    if (isOpen && initialPlanData) {
      setWorkshopType(initialPlanData.is_official_workshop ? 'official' : 'diy');
      setWorkshopName(initialPlanData.workshop_name_manual || initialPlanData.workshop_info?.workshop_name || '');
      setServiceDate(initialPlanData.planned_date || new Date().toISOString().slice(0, 10));
      setMileage(
        initialPlanData.target_mileage && initialPlanData.target_mileage > 0
          ? String(initialPlanData.target_mileage)
          : String(currentMileage)
      );
      setComplaints(initialPlanData.title || '');
      setNotes(initialPlanData.notes || '');
      setReceiptPhotoUrl('');
      setErrors({});
      setGlobalError('');
    } else if (!isOpen) {
      setWorkshopType('diy');
      setWorkshopName('');
      setServiceDate(new Date().toISOString().slice(0, 10));
      setMileage(String(currentMileage));
      setComplaints('');
      setNotes('');
      setReceiptPhotoUrl('');
      setItems([newLineItem()]);
      setErrors({});
      setGlobalError('');
    }
  }, [isOpen, initialPlanData, currentMileage]);

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setGlobalError('File struk harus berupa gambar');
      return;
    }

    setIsProcessingReceiptPhoto(true);
    try {
      const dataUrl = await compressReceiptImage(file);
      setReceiptPhotoUrl(dataUrl);
      setGlobalError('');
    } catch (err) {
      console.error(err);
      setGlobalError('Gagal memproses foto struk');
    } finally {
      setIsProcessingReceiptPhoto(false);
    }
  };

  const totalCost = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const updateItem = useCallback(
    (id: string, field: keyof LineItem, value: string | number) => {
      setItems((prev) =>
        prev.map((item) => (item._id === id ? { ...item, [field]: value } : item))
      );
    },
    []
  );

  const addItem = () => setItems((prev) => [...prev, newLineItem()]);

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item._id !== id));
  };

  const handleMasterItemSelect = (lineItemId: string, masterItemId: string) => {
    const found = masterItems.find((m) => m.id === masterItemId);
    setItems((prev) =>
      prev.map((item) => {
        if (item._id !== lineItemId) return item;
        return {
          ...item,
          master_item_id: masterItemId,
          item_name: found ? found.item_name : item.item_name,
        };
      })
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (workshopType === 'official' && !workshopName.trim()) {
      newErrors.workshop_name = 'Nama bengkel resmi wajib diisi';
    }

    if (!serviceDate) {
      newErrors.service_date = 'Tanggal servis wajib diisi';
    }

    const mileageNum = Number(mileage);
    if (!mileage || isNaN(mileageNum) || mileageNum < 0) {
      newErrors.mileage = 'Kilometer saat servis wajib diisi';
    }

    items.forEach((item, idx) => {
      if (!item.item_name.trim()) {
        newErrors[`item_name_${idx}`] = 'Nama item wajib diisi';
      }
      if (item.quantity < 1) {
        newErrors[`item_qty_${idx}`] = 'Qty minimal 1';
      }
      if (item.unit_price < 0) {
        newErrors[`item_price_${idx}`] = 'Harga tidak valid';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      const data: CreateServiceRecordData = {
        is_official_workshop: workshopType === 'official',
        workshop_name_manual: workshopName.trim() || undefined,
        service_date: serviceDate,
        mileage_at_service: Number(mileage),
        complaints: complaints.trim() || undefined,
        notes: notes.trim() || undefined,
        receipt_photo_url: receiptPhotoUrl || undefined,
        items: items.map(({ _id: _ignored, ...rest }) => rest),
      };
      await onSubmit(data);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan data servis';
      setGlobalError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Servis Baru"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Biaya</span>
            <p className="text-lg font-extrabold text-slate-900 leading-none">
              {formatRupiah(totalCost)}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button
              type="submit"
              form="add-service-form"
              isLoading={isLoading}
            >
              Simpan Servis
            </Button>
          </div>
        </div>
      }
    >
      <form id="add-service-form" onSubmit={handleSubmit} className="space-y-6">
        {/* ── Vehicle Selector (if vehicles provided) ── */}
        {vehicles && vehicles.length > 0 && onVehicleChange && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Pilih Kendaraan Yang Diservis
            </label>
            <select
              onChange={(e) => {
                const found = vehicles.find((v) => v.id === e.target.value);
                if (found) onVehicleChange(found);
              }}
              className="input-field text-xs font-semibold bg-white"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} — {v.license_plate} ({v.current_mileage.toLocaleString('id-ID')} km)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ── Workshop Type ── */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Jenis Bengkel
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setWorkshopType('official')}
              className={[
                'flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all',
                workshopType === 'official'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300',
              ].join(' ')}
            >
              <Store size={18} className={workshopType === 'official' ? 'text-blue-600' : 'text-slate-400'} />
              <div className="text-left">
                <p className="font-semibold">Bengkel Resmi</p>
                <p className="text-xs opacity-70">Partner Odomtr</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setWorkshopType('diy')}
              className={[
                'flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all',
                workshopType === 'diy'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300',
              ].join(' ')}
            >
              <Wrench size={18} className={workshopType === 'diy' ? 'text-blue-600' : 'text-slate-400'} />
              <div className="text-left">
                <p className="font-semibold">Manual / DIY</p>
                <p className="text-xs opacity-70">Bengkel Umum / Mandiri</p>
              </div>
            </button>
          </div>
        </div>

        {/* ── Workshop Name (if official or manual) ── */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Nama Bengkel{' '}
            {workshopType === 'official' ? (
              <span className="text-red-500">*</span>
            ) : (
              <span className="text-slate-400 font-normal">(opsional)</span>
            )}
          </label>
          <input
            type="text"
            className={`input-field ${errors.workshop_name ? 'error' : ''}`}
            placeholder={
              workshopType === 'official'
                ? 'Contoh: Auto2000 Cilandak, AHASS Utama'
                : 'Contoh: Bengkel Mas Joko, DIY Garage'
            }
            value={workshopName}
            onChange={(e) => {
              setWorkshopName(e.target.value);
              if (errors.workshop_name)
                setErrors((p) => ({ ...p, workshop_name: '' }));
            }}
          />
          {errors.workshop_name && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.workshop_name}
            </p>
          )}
        </div>

        {/* ── Date + Mileage ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tanggal Servis <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={`input-field ${errors.service_date ? 'error' : ''}`}
              value={serviceDate}
              onChange={(e) => {
                setServiceDate(e.target.value);
                if (errors.service_date)
                  setErrors((p) => ({ ...p, service_date: '' }));
              }}
            />
            {errors.service_date && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.service_date}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Kilometer Saat Servis <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                className={`input-field pr-10 ${errors.mileage ? 'error' : ''}`}
                placeholder="0"
                value={mileage}
                min={0}
                onChange={(e) => {
                  setMileage(e.target.value);
                  if (errors.mileage) setErrors((p) => ({ ...p, mileage: '' }));
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                km
              </span>
            </div>
            {errors.mileage && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.mileage}
              </p>
            )}
          </div>
        </div>

        {/* ── Receipt Photo Upload ── */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Camera size={16} className="text-blue-600" />
              Foto Struk / Nota Fisik Asli <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <span className="text-[10px] text-blue-600 font-semibold bg-blue-100 px-2 py-0.5 rounded-full">
              Simpan ke Database
            </span>
          </div>

          <input
            ref={receiptFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleReceiptFileChange}
            className="hidden"
          />

          {receiptPhotoUrl ? (
            <div className="relative h-40 rounded-xl overflow-hidden border-2 border-blue-500 group shadow-xs">
              <img src={receiptPhotoUrl} alt="Preview Struk" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => receiptFileInputRef.current?.click()}
                  className="bg-white text-slate-800 p-2 rounded-lg text-xs font-bold shadow hover:bg-slate-100 flex items-center gap-1 px-2.5"
                >
                  <Camera size={13} /> Ubah Struk
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptPhotoUrl('')}
                  className="bg-red-600 text-white p-2 rounded-lg text-xs font-bold shadow hover:bg-red-700 flex items-center gap-1 px-2.5"
                >
                  <Trash2 size={13} /> Hapus
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => receiptFileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-xl p-4 text-center cursor-pointer transition-all flex items-center justify-center gap-3 group"
            >
              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                {isProcessingReceiptPhoto ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">
                  {isProcessingReceiptPhoto ? 'Memproses foto struk...' : 'Upload Foto Struk / Nota Fisik'}
                </p>
                <p className="text-[10px] text-slate-400">
                  Foto nota fisik dari bengkel untuk disimpan di struk digital
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Complaints ── */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Keluhan / Pekerjaan <span className="text-slate-400 font-normal">(opsional)</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Contoh: Oli mesin rembes, rem bunyi, ganti busi"
            value={complaints}
            onChange={(e) => setComplaints(e.target.value)}
          />
        </div>

        {/* ── Dynamic Line Items ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Rincian Item & Biaya</h4>
              <p className="text-xs text-slate-400">Pilih dari katalog atau ketik nama item custom</p>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} /> Tambah Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item._id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-3"
              >
                {/* Item Name / Dropdown */}
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Item #{idx + 1}
                  </label>

                  {masterItems.length > 0 ? (
                    <div className="space-y-1">
                      <select
                        className={`input-field text-sm py-2 ${errors[`item_name_${idx}`] ? 'error' : ''}`}
                        value={item.master_item_id ?? ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleMasterItemSelect(item._id, e.target.value);
                          } else {
                            updateItem(item._id, 'master_item_id', '');
                            updateItem(item._id, 'item_name', '');
                          }
                        }}
                        disabled={isFetchingMaster}
                      >
                        <option value="">— Pilih atau ketik —</option>
                        {masterItems.map((m) => (
                          <option key={m.id} value={m.id}>{m.item_name}</option>
                        ))}
                      </select>
                      {!item.master_item_id && (
                        <input
                          type="text"
                          className={`input-field text-sm py-2 ${errors[`item_name_${idx}`] ? 'error' : ''}`}
                          placeholder="Nama item custom"
                          value={item.item_name}
                          onChange={(e) => updateItem(item._id, 'item_name', e.target.value)}
                        />
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className={`input-field text-sm py-2 ${errors[`item_name_${idx}`] ? 'error' : ''}`}
                      placeholder="Nama item servis"
                      value={item.item_name}
                      onChange={(e) => updateItem(item._id, 'item_name', e.target.value)}
                    />
                  )}
                  {errors[`item_name_${idx}`] && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle size={11} /> {errors[`item_name_${idx}`]}
                    </p>
                  )}
                </div>

                {/* Qty */}
                <div className="w-20 shrink-0">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="input-field text-sm py-2 text-center"
                    value={item.quantity}
                    onChange={(e) => updateItem(item._id, 'quantity', Math.max(1, Number(e.target.value)))}
                  />
                </div>

                {/* Price */}
                <div className="w-36 shrink-0">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    className="input-field text-sm py-2"
                    placeholder="0"
                    value={item.unit_price || ''}
                    onChange={(e) => updateItem(item._id, 'unit_price', Number(e.target.value))}
                  />
                </div>

                {/* Subtotal */}
                <div className="w-32 shrink-0 text-right">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Subtotal
                  </label>
                  <p className="text-sm font-bold text-slate-900 py-2">
                    {formatRupiah(item.quantity * item.unit_price)}
                  </p>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeItem(item._id)}
                  disabled={items.length === 1}
                  className="mt-1 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Hapus item"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Total</span>
            <span className="text-xl font-bold text-blue-700">{formatRupiah(totalCost)}</span>
          </div>
        </div>

        {/* ── Notes ── */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Catatan <span className="text-slate-400 font-normal">(opsional)</span>
          </label>
          <textarea
            className="input-field resize-none"
            rows={2}
            placeholder="Catatan tambahan, next service reminder, dll"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
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

export default AddServiceModal;
