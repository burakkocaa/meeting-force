import { User } from '@prisma/client';

// Permission yapısı
export interface Permission {
  module: string;
  actions: string[];
}

// Yaygın permission tipleri
export interface UserPermissions {
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

// Temel Role tipi
export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  permissions: any; // JSON formatında permissions
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// İlişkiler dahil Role tipi
export interface RoleWithRelations extends Role {
  users: User[];
}

// Role oluşturma için gerekli alanlar
export interface CreateRoleData {
  name: string;
  displayName: string;
  description?: string;
  permissions: UserPermissions | any;
  isActive?: boolean;
}

// Role güncelleme için opsiyonel alanlar
export interface UpdateRoleData {
  name?: string;
  displayName?: string;
  description?: string | null;
  permissions?: UserPermissions | any;
  isActive?: boolean;
}

// Role özeti (liste görünümü için)
export interface RoleSummary {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  isActive: boolean;
  userCount: number;
  createdAt: Date;
}

// Role detayı (tek rol görünümü için)
export interface RoleDetail {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  permissions: UserPermissions | any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  users: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  }[];
}

// Permission kontrol fonksiyonu için tip
export interface PermissionCheck {
  module: string;
  action: string;
}

// Varsayılan roller
export const DEFAULT_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  GUEST: 'guest',
} as const;

// Varsayılan permission setleri
export const DEFAULT_PERMISSIONS: Record<string, UserPermissions> = {
  admin: {
    users: { create: true, read: true, update: true, delete: true },
    meetings: { create: true, read: true, update: true, delete: true, manage: true },
    roles: { create: true, read: true, update: true, delete: true },
    reports: { read: true, export: true },
    settings: { read: true, update: true },
  },
  manager: {
    users: { create: true, read: true, update: true, delete: false },
    meetings: { create: true, read: true, update: true, delete: true, manage: true },
    roles: { create: false, read: true, update: false, delete: false },
    reports: { read: true, export: true },
    settings: { read: true, update: false },
  },
  user: {
    users: { create: false, read: true, update: false, delete: false },
    meetings: { create: true, read: true, update: false, delete: false, manage: false },
    roles: { create: false, read: false, update: false, delete: false },
    reports: { read: false, export: false },
    settings: { read: false, update: false },
  },
  guest: {
    users: { create: false, read: false, update: false, delete: false },
    meetings: { create: false, read: true, update: false, delete: false, manage: false },
    roles: { create: false, read: false, update: false, delete: false },
    reports: { read: false, export: false },
    settings: { read: false, update: false },
  },
};

// Prisma select options
export const roleSelectOptions = {
  basic: {
    id: true,
    name: true,
    displayName: true,
    description: true,
    isActive: true,
    createdAt: true,
  },
  withUserCount: {
    id: true,
    name: true,
    displayName: true,
    description: true,
    isActive: true,
    createdAt: true,
    _count: {
      users: true,
    },
  },
  withUsers: {
    id: true,
    name: true,
    displayName: true,
    description: true,
    permissions: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    users: {
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    },
  },
  full: {
    id: true,
    name: true,
    displayName: true,
    description: true,
    permissions: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  },
} as const;

// Permission yardımcı fonksiyonları
export class PermissionHelper {
  // Permission kontrol
  static hasPermission(
    userPermissions: UserPermissions | any,
    module: string,
    action: string
  ): boolean {
    if (!userPermissions || !userPermissions[module]) {
      return false;
    }
    
    return userPermissions[module][action] === true;
  }

  // Tüm permission'ları kontrol et
  static hasAnyPermission(
    userPermissions: UserPermissions | any,
    checks: PermissionCheck[]
  ): boolean {
    return checks.some(check => 
      this.hasPermission(userPermissions, check.module, check.action)
    );
  }

  // Tüm permission'ları kontrol et
  static hasAllPermissions(
    userPermissions: UserPermissions | any,
    checks: PermissionCheck[]
  ): boolean {
    return checks.every(check => 
      this.hasPermission(userPermissions, check.module, check.action)
    );
  }

 // Permission'ları birleştir
static mergePermissions(
  permissions1: UserPermissions,
  permissions2: UserPermissions
): UserPermissions {
  const merged = {} as UserPermissions;
  
  // Her modül için ayrı ayrı handle et
  const modules = Object.keys(permissions1) as Array<keyof UserPermissions>;
  
  modules.forEach(module => {
    const perm1 = permissions1[module];
    const perm2 = permissions2[module];
    
    // Object.assign kullanarak güvenli birleştir
    merged[module] = Object.assign({}, perm1, perm2) as any;
  });
  
  return merged;
}

  // Permission'ları validate et
  static validatePermissions(permissions: any): boolean {
    const requiredModules = ['users', 'meetings', 'roles', 'reports', 'settings'];
    
    if (!permissions || typeof permissions !== 'object') {
      return false;
    }

    return requiredModules.every(module => {
      return permissions[module] && typeof permissions[module] === 'object';
    });
  }
}