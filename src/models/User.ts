import { Role, Meet } from '@prisma/client';

// Temel User tipi
export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}

// İlişkiler dahil User tipi
export interface UserWithRelations extends User {
  role: Role;
  meetings: Meet[];
}

// User oluşturma için gerekli alanlar
export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phoneNumber?: string;
  roleId: string;
  isActive?: boolean;
  emailVerified?: boolean;
}

// User güncelleme için opsiyonel alanlar
export interface UpdateUserData {
  email?: string;
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  phoneNumber?: string | null;
  isActive?: boolean;
  emailVerified?: boolean;
  roleId?: string;
  lastLoginAt?: Date | null;
}

// Login için gerekli alanlar
export interface LoginData {
  email?: string;
  username?: string;
  password: string;
}

// Kullanıcı profili için public bilgiler
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  role: {
    id: string;
    name: string;
    description?: string | null;
  };
}

// Kullanıcı listesi için özet bilgiler
export interface UserSummary {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  isActive: boolean;
  role: {
    name: string;
  };
  createdAt: Date;
}

// Prisma select options
export const userSelectOptions = {
  basic: {
    id: true,
    email: true,
    username: true,
    firstName: true,
    lastName: true,
    avatar: true,
    isActive: true,
    emailVerified: true,
    createdAt: true,
  },
  withRole: {
    id: true,
    email: true,
    username: true,
    firstName: true,
    lastName: true,
    avatar: true,
    phoneNumber: true,
    isActive: true,
    emailVerified: true,
    createdAt: true,
    role: {
      select: {
        id: true,
        name: true,
        description: true,
      },
    },
  },
  withMeetings: {
    id: true,
    email: true,
    username: true,
    firstName: true,
    lastName: true,
    avatar: true,
    isActive: true,
    meetings: {
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
      },
    },
  },
} as const;