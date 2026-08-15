import React, { useState, useEffect } from 'react';
import { Car, Plus, Search, AlertCircle } from 'lucide-react';
import { vehicleService } from '../services/vehicleService';
import { VehicleCard } from '../components/vehicle/VehicleCard';
import { AddVehicleModal } from '../components/vehicle/AddVehicleModal';
import { Button } from '../components/common/Button';
import type { Vehicle } from '../types';
import { useTranslation } from '../context/LanguageContext';

export function VehiclesPage() {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filterCategory, setFilterCategory] = useState<'all' | 'mobil' | 'motor'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  const fetchVehicles = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat daftar kendaraan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter((v) => {
    const matchesCategory = filterCategory === 'all' || v.category === filterCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.license_plate.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 bg-slate-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md">
                <Car size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{t('dash_my_vehicles')}</h1>
                <p className="text-xs text-slate-500">
                  Kelola garasi kendaraan pribadi Anda, lihat spesifikasi & riwayat Odometer
                </p>
              </div>
            </div>
          </div>

          <Button
            leftIcon={<Plus size={16} />}
            onClick={() => setShowAddVehicle(true)}
          >
            {t('dash_add_vehicle')}
          </Button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterCategory('all')}
              className={[
                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all',
                filterCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              ].join(' ')}
            >
              Semua ({vehicles.length})
            </button>
            <button
              onClick={() => setFilterCategory('mobil')}
              className={[
                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
                filterCategory === 'mobil'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              ].join(' ')}
            >
              🚗 Mobil ({vehicles.filter((v) => v.category === 'mobil').length})
            </button>
            <button
              onClick={() => setFilterCategory('motor')}
              className={[
                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
                filterCategory === 'motor'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              ].join(' ')}
            >
              🏍️ Motor ({vehicles.filter((v) => v.category === 'motor').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari merk, tipe, plat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 text-xs bg-slate-50"
            />
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-56 rounded-2xl" />
            ))}
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto">
            <Car size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">{t('dash_no_vehicles')}</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">{t('dash_no_vehicles_desc')}</p>
            <Button
              leftIcon={<Plus size={16} />}
              onClick={() => setShowAddVehicle(true)}
            >
              {t('dash_add_first_vehicle')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}

        {/* Add Vehicle Modal */}
        <AddVehicleModal
          isOpen={showAddVehicle}
          onClose={() => setShowAddVehicle(false)}
          onSubmit={async (data) => {
            await vehicleService.createVehicle(data);
            await fetchVehicles();
          }}
        />
      </div>
    </div>
  );
}

export default VehiclesPage;
