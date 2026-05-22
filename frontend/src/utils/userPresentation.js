export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join('');
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

export function buildMediaUrl(url) {
  if (!url) {
    return '';
  }

  if (url.startsWith('/storage/')) {
    return `${BACKEND_URL}${url}`;
  }

  if (url.startsWith('http://localhost/storage/') || url.startsWith('https://localhost/storage/')) {
    return url.replace(/^https?:\/\/localhost/, BACKEND_URL);
  }

  if (url.startsWith('http://127.0.0.1/storage/') || url.startsWith('https://127.0.0.1/storage/')) {
    return url.replace(/^https?:\/\/127\.0\.0\.1/, BACKEND_URL);
  }

  return url;
}

export function buildAvatarUrl(user) {
  if (user?.avatar) {
    return buildMediaUrl(user.avatar);
  }

  const label = encodeURIComponent(user?.name || 'AloHirafi User');
  return `https://ui-avatars.com/api/?name=${label}&background=1f6feb&color=ffffff&size=256`;
}

export function formatRole(role, t = (key) => key) {
  if (role === 'admin') {
    return t('common.role.admin');
  }

  return role === 'artisan' ? t('common.role.artisan') : t('common.role.client');
}
