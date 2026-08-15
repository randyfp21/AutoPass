// ─── Currency ─────────────────────────────────────────────────────────────────

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatRupiah(value: number): string {
  return rupiahFormatter.format(value);
}

// ─── Mileage ──────────────────────────────────────────────────────────────────

const mileageFormatter = new Intl.NumberFormat('id-ID');

export function formatMileage(km: number): string {
  return mileageFormatter.format(km);
}

// ─── Date ─────────────────────────────────────────────────────────────────────

export function formatDate(
  dateStr: string,
  format: 'full' | 'short' | 'month' | 'day' | 'year' | 'monthYear'
): string {
  const date = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));

  switch (format) {
    case 'full':
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    case 'short':
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    case 'month':
      return date.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
    case 'day':
      return String(date.getDate()).padStart(2, '0');
    case 'year':
      return String(date.getFullYear());
    case 'monthYear':
      return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    default:
      return dateStr;
  }
}

// ─── Relative Time ────────────────────────────────────────────────────────────

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan lalu`;
  return `${Math.floor(diffDays / 365)} tahun lalu`;
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}
