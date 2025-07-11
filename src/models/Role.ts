// Basit enum yapısı
export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  GUEST = 'guest'
}

// Permission yapısı
export interface Permissions {
  users: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  meetings: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    manage: boolean;
  };
  roles: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  reports: {
    read: boolean;
    export: boolean;
  };
  settings: {
    read: boolean;
    update: boolean;
  };
}

// Sabit role tanımları
export const ROLE_PERMISSIONS: Record<Role, Permissions> = {
  [Role.ADMIN]: {
    users: { create: true, read: true, update: true, delete: true },
    meetings: { create: true, read: true, update: true, delete: true, manage: true },
    roles: { create: true, read: true, update: true, delete: true },
    reports: { read: true, export: true },
    settings: { read: true, update: true },
  },
  [Role.MANAGER]: {
    users: { create: true, read: true, update: true, delete: false },
    meetings: { create: true, read: true, update: true, delete: true, manage: true },
    roles: { create: false, read: true, update: false, delete: false },
    reports: { read: true, export: true },
    settings: { read: true, update: false },
  },
  [Role.USER]: {
    users: { create: false, read: true, update: false, delete: false },
    meetings: { create: true, read: true, update: false, delete: false, manage: false },
    roles: { create: false, read: false, update: false, delete: false },
    reports: { read: false, export: false },
    settings: { read: false, update: false },
  },
  [Role.GUEST]: {
    users: { create: false, read: false, update: false, delete: false },
    meetings: { create: false, read: true, update: false, delete: false, manage: false },
    roles: { create: false, read: false, update: false, delete: false },
    reports: { read: false, export: false },
    settings: { read: false, update: false },
  },
};

// Basit permission kontrol fonksiyonu
export function hasPermission(
  userRole: Role,
  module: keyof Permissions,
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  const modulePermissions = permissions[module] as any;
  return modulePermissions?.[action] === true;
}

// Role hiyerarşisi kontrol
export function isHigherRole(role1: Role, role2: Role): boolean {
  const hierarchy = {
    [Role.ADMIN]: 4,
    [Role.MANAGER]: 3,
    [Role.USER]: 2,
    [Role.GUEST]: 1,
  };
  return hierarchy[role1] > hierarchy[role2];
}

// Admin kontrol
export function isAdmin(role: Role): boolean {
  return role === Role.ADMIN;
}

// Manager veya üstü kontrol
export function isManagerOrAbove(role: Role): boolean {
  return role === Role.ADMIN || role === Role.MANAGER;
}

// Database seed data
export const SEED_ROLES = [
  {
    name: Role.ADMIN,
    displayName: 'Admin',
    description: 'Sistem yöneticisi',
    permissions: JSON.stringify(ROLE_PERMISSIONS[Role.ADMIN]),
    isActive: true,
  },
  {
    name: Role.MANAGER,
    displayName: 'Manager',
    description: 'Departman yöneticisi',
    permissions: JSON.stringify(ROLE_PERMISSIONS[Role.MANAGER]),
    isActive: true,
  },
  {
    name: Role.USER,
    displayName: 'User',
    description: 'Standart kullanıcı',
    permissions: JSON.stringify(ROLE_PERMISSIONS[Role.USER]),
    isActive: true,
  },
  {
    name: Role.GUEST,
    displayName: 'Guest',
    description: 'Misafir kullanıcı',
    permissions: JSON.stringify(ROLE_PERMISSIONS[Role.GUEST]),
    isActive: true,
  },
];

// Kullanım örnekleri:
// hasPermission(Role.ADMIN, 'users', 'delete') // true
// isAdmin(userRole) // boolean
// isManagerOrAbove(userRole) // boolean