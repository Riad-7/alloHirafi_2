export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join('');
}

export function buildAvatarUrl(user) {
  if (user?.avatar) {
    return user.avatar;
  }

  const label = encodeURIComponent(user?.name || 'AloHirafi User');
  return `https://ui-avatars.com/api/?name=${label}&background=1f6feb&color=ffffff&size=256`;
}

export function formatRole(role) {
  return role === 'artisan' ? 'Artisan' : 'Client';
}
