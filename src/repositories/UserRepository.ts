import { PrismaClient, User } from '@prisma/client';
import { 
  CreateUserData, 
  UpdateUserData, 
  UserWithRelations, 
  UserProfile, 
  UserSummary,
  userSelectOptions 
} from '../models/User';

export class UserRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Kullanıcı oluşturma
  async create(userData: CreateUserData): Promise<User> {
    return await this.prisma.user.create({
      data: userData,
    });
  }

  // ID ile kullanıcı bulma
  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  // Email ile kullanıcı bulma
  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Username ile kullanıcı bulma
  async findByUsername(username: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { username },
    });
  }

  // Email veya username ile kullanıcı bulma (login için)
  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });
  }

  // Role ile birlikte kullanıcı bulma
  async findByIdWithRole(id: string): Promise<UserWithRelations | null> {
    return await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        meetings: true,
      },
    });
  }

  // Kullanıcı profili getirme
  async getUserProfile(id: string): Promise<UserProfile | null> {
    return await this.prisma.user.findUnique({
      where: { id },
      select: userSelectOptions.withRole,
    });
  }

  // Tüm kullanıcıları listeleme
  async findAll(
    page: number = 1,
    limit: number = 10,
    isActive?: boolean
  ): Promise<UserSummary[]> {
    const skip = (page - 1) * limit;
    
    return await this.prisma.user.findMany({
      where: {
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        role: {
          select: {
            name: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Kullanıcı sayısı
  async count(isActive?: boolean): Promise<number> {
    return await this.prisma.user.count({
      where: {
        ...(isActive !== undefined && { isActive }),
      },
    });
  }

  // Kullanıcı güncelleme
  async update(id: string, userData: UpdateUserData): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data: userData,
    });
  }

  // Kullanıcı silme (soft delete)
  async delete(id: string): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  // Kullanıcı kalıcı silme
  async hardDelete(id: string): Promise<User> {
    return await this.prisma.user.delete({
      where: { id },
    });
  }

  // Email doğrulama
  async verifyEmail(id: string): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data: {
        emailVerified: true,
      },
    });
  }

  // Son giriş zamanını güncelleme
  async updateLastLogin(id: string): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  // Şifre güncelleme
  async updatePassword(id: string, newPassword: string): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data: {
        password: newPassword,
      },
    });
  }

  // Role göre kullanıcı arama
  async findByRole(roleId: string): Promise<User[]> {
    return await this.prisma.user.findMany({
      where: { roleId },
      include: {
        role: true,
      },
    });
  }

  // Arama (isim, email, username)
  async search(query: string, limit: number = 10): Promise<UserSummary[]> {
    return await this.prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        role: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
      orderBy: {
        firstName: 'asc',
      },
    });
  }

  // Email veya username'in kullanılıp kullanılmadığını kontrol etme
  async isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) return false;
    if (excludeId && user.id === excludeId) return false;
    return true;
  }

  async isUsernameTaken(username: string, excludeId?: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) return false;
    if (excludeId && user.id === excludeId) return false;
    return true;
  }

//   // Kullanıcının toplantıları
//   async getUserMeetings(userId: string): Promise<any[]> {
//     const user = await this.prisma.user.findUnique({
//       where: { id: userId },
//       select: {
//         meetings: {
//           select: {
//             id: true,
//             title: true,
//             description: true,
//             startTime: true,
//             endTime: true,
//             createdAt: true,
//           },
//           orderBy: {
//             startTime: 'asc',
//           },
//         },
//       },
//     });

//     return user?.meetings || [];
//   }
}