import React, { useState } from 'react';
import {
  Store,
  CheckCircle,
  Clock,
  Plus,
  Wrench,
  Star,
  MapPin,
  Phone,
  BarChart2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

// ─── Mock workshop data ────────────────────────────────────────────────────────
// In production this would come from /api/v1/workshop/my

const MOCK_RECENT_SERVICES = [
  {
    id: '1',
    vehicle_plate: 'B 1234 ABC',
    vehicle_name: 'Toyota Avanza',
    service_date: '2026-08-10',
    total_cost: 450000,
    items_count: 3,
    customer_name: 'Andi Wijaya',
  },
  {
    id: '2',
    vehicle_plate: 'D 5678 XYZ',
    vehicle_name: 'Honda Vario 160',
    service_date: '2026-08-12',
    total_cost: 185000,
    items_count: 2,
    customer_name: 'Sari Dewi',
  },
  {
    id: '3',
    vehicle_plate: 'B 9999 PRO',
    vehicle_name: 'Mitsubishi Pajero',
    service_date: '2026-08-14',
    total_cost: 1250000,
    items_count: 5,
    customer_name: 'Budi Santoso',
  },
];

// ─── Setup Form ───────────────────────────────────────────────────────────────

interface SetupFormData {
  workshop_name: string;
  address: string;
  phone: string;
}

function SetupWorkshopForm({ onSetup }: { onSetup: (data: SetupFormData) => void }) {
  const [form, setForm] = useState<SetupFormData>({
    workshop_name: '',
    address: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Partial<SetupFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errs: Partial<SetupFormData> = {};
    if (!form.workshop_name.trim()) errs.workshop_name = 'Nama bengkel wajib diisi';
    if (!form.address.trim()) errs.address = 'Alamat wajib diisi';
    if (!form.phone.trim()) errs.phone = 'Nomor telepon wajib diisi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    onSetup(form);
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store size={30} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Setup Profil Bengkel</h2>
          <p className="text-slate-500 text-sm mt-1">
            Lengkapi profil bengkel Anda untuk mulai menerima catatan servis
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nama Bengkel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`input-field ${errors.workshop_name ? 'error' : ''}`}
              placeholder="Bengkel Maju Jaya"
              value={form.workshop_name}
              onChange={(e) => setForm((p) => ({ ...p, workshop_name: e.target.value }))}
            />
            {errors.workshop_name && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.workshop_name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Alamat Bengkel <span className="text-red-500">*</span>
            </label>
            <textarea
              className={`input-field resize-none ${errors.address ? 'error' : ''}`}
              rows={2}
              placeholder="Jl. Contoh No. 123, Jakarta Selatan"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.address}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nomor Telepon <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              className={`input-field ${errors.phone ? 'error' : ''}`}
              placeholder="0812-3456-7890"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.phone}
              </p>
            )}
          </div>

          <Button type="submit" fullWidth size="lg" isLoading={isLoading} className="mt-2">
            Buat Profil Bengkel
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WorkshopDashboardPage() {
  const { user } = useAuth();
  const [hasWorkshop, setHasWorkshop] = useState(false);
  const [workshopData, setWorkshopData] = useState<SetupFormData | null>(null);

  const handleSetup = (data: SetupFormData) => {
    setWorkshopData(data);
    setHasWorkshop(true);
  };

  if (!hasWorkshop) {
    return (
      <div className="flex-1 bg-slate-50 py-12 px-4">
        <SetupWorkshopForm onSetup={handleSetup} />
      </div>
    );
  }

  const totalRevenue = MOCK_RECENT_SERVICES.reduce((sum, s) => sum + s.total_cost, 0);
  const stats = [
    { label: 'Servis Bulan Ini', value: '28', icon: <Wrench size={20} className="text-blue-600" />, bg: 'bg-blue-50' },
    { label: 'Total Pelanggan', value: '142', icon: <Star size={20} className="text-yellow-600" />, bg: 'bg-yellow-50' },
    { label: 'Pendapatan', value: new Intl.NumberFormat('id-ID', { notation: 'compact', currency: 'IDR', style: 'currency' }).format(totalRevenue), icon: <BarChart2 size={20} className="text-green-600" />, bg: 'bg-green-50' },
  ];

  return (
    <div className="flex-1 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-sm text-slate-500 mb-1">Dashboard Bengkel</p>
            <h1 className="text-3xl font-bold text-slate-900">{workshopData?.workshop_name}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin size={13} /> {workshopData?.address}
              </span>
              <span className="flex items-center gap-1">
                <Phone size={13} /> {workshopData?.phone}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`badge ${true ? 'badge-orange' : 'badge-green'} flex items-center gap-1`}
            >
              {true ? <Clock size={11} /> : <CheckCircle size={11} />}
              {true ? 'Menunggu Verifikasi' : 'Terverifikasi'}
            </span>
          </div>
        </div>

        {/* ── Pending Verification Banner ── */}
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
          <Clock size={18} className="text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">Menunggu Verifikasi Tim Odomtr</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Profil bengkel Anda sedang dalam proses verifikasi. Anda sudah bisa mencatat servis,
              namun badge "Bengkel Resmi" akan muncul setelah terverifikasi.
            </p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4"
            >
              <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 leading-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Recent Services ── */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Servis Terbaru</h2>
              <Button size="sm" leftIcon={<Plus size={14} />}>
                Catat Servis
              </Button>
            </div>

            <div className="space-y-3">
              {MOCK_RECENT_SERVICES.map((s) => (
                <div
                  key={s.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Wrench size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{s.vehicle_name}</p>
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ fontFamily: 'Rajdhani, sans-serif', background: '#FFDD00', color: '#000', border: '1px solid #000' }}
                      >
                        {s.vehicle_plate}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {s.customer_name} · {s.items_count} item · {s.service_date}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 shrink-0">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(s.total_cost)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">
            {/* Workshop profile card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="font-bold text-slate-900 mb-4">Profil Bengkel</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <Store size={15} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700">{workshopData?.workshop_name}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700">{workshopData?.address}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone size={15} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700">{workshopData?.phone}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Star size={15} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700">Rating: <strong>4.8/5</strong> (24 ulasan)</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" fullWidth className="mt-4">
                Edit Profil
              </Button>
            </div>

            {/* Pricing management placeholder */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="font-bold text-slate-900 mb-2">Manajemen Harga</h3>
              <p className="text-xs text-slate-500 mb-4">
                Atur daftar harga layanan bengkel Anda agar muncul di catalog Odomtr
              </p>
              <div className="flex items-center justify-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                <div className="text-center">
                  <BarChart2 size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Fitur segera hadir</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkshopDashboardPage;
