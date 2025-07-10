import { UserRepository } from '../repositories/UserRepository';
import { 
  CreateUserData, 
  UpdateUserData, 
  LoginData, 
  UserProfile, 
  UserSummary 
} from '../models/User';

export interface LoginResult {
  user: UserProfile;
  message: string;
}

export interface PaginatedUsers {
  users: UserSummary[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  // Basit şifre hashleme (production için bcrypt kullanın)
  private async hashPassword(password: string): Promise<string> {
    // Bu sadece geliştirme amaçlı basit bir hash
    // Production'da mutlaka bcrypt kullanın
    return Buffer.from(password).toString('base64');
  }

  // Şifre doğrulama
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const hashedInput = await this.hashPassword(password);
    return hashedInput === hashedPassword;
  }

  // Kullanıcı kayıt
  async register(userData: CreateUserData): Promise<UserProfile> {
    // Email ve username benzersizlik kontrolü
    const isEmailTaken = await this.userRepository.isEmailTaken(userData.email);
    if (isEmailTaken) {
      throw new Error('Email already exists');
    }

    const isUsernameTaken = await this.userRepository.isUsernameTaken(userData.username);
    if (isUsernameTaken) {
      throw new Error('Username already exists');
    }

    // Şifreyi hashleme
    const hashedPassword = await this.hashPassword(userData.password);

    // Kullanıcı oluşturma
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    // Profil bilgilerini döndürme
    const userProfile = await this.userRepository.getUserProfile(user.id);
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    return userProfile;
  }

  // Kullanıcı giriş
  async login(loginData: LoginData): Promise<LoginResult> {
    const { password } = loginData;
    const identifier = loginData.email || loginData.username;

    if (!identifier) {
      throw new Error('Email or username is required');
    }

    // Kullanıcıyı bulma
    const user = await this.userRepository.findByEmailOrUsername(identifier);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Kullanıcı aktif mi kontrol
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Şifre kontrolü
    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Son giriş zamanını güncelleme
    await this.userRepository.updateLastLogin(user.id);

    // Kullanıcı profili getirme
    const userProfile = await this.userRepository.getUserProfile(user.id);
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    return {
      user: userProfile,
      message: 'Login successful',
    };
  }

  // Kullanıcı profili getirme
  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepository.getUserProfile(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Kullanıcı güncelleme
  async updateUser(userId: string, updateData: UpdateUserData): Promise<UserProfile> {
    // Email değişikliği kontrolü
    if (updateData.email) {
      const isEmailTaken = await this.userRepository.isEmailTaken(updateData.email, userId);
      if (isEmailTaken) {
        throw new Error('Email already exists');
      }
    }

    // Username değişikliği kontrolü
    if (updateData.username) {
      const isUsernameTaken = await this.userRepository.isUsernameTaken(updateData.username, userId);
      if (isUsernameTaken) {
        throw new Error('Username already exists');
      }
    }

    // Şifre değişikliği
    if (updateData.password) {
      updateData.password = await this.hashPassword(updateData.password);
    }

    await this.userRepository.update(userId, updateData);

    const updatedUser = await this.userRepository.getUserProfile(userId);
    if (!updatedUser) {
      throw new Error('User not found after update');
    }

    return updatedUser;
  }

  // Kullanıcıları listeleme
  async getUsers(
    page: number = 1,
    limit: number = 10,
    isActive?: boolean
  ): Promise<PaginatedUsers> {
    const users = await this.userRepository.findAll(page, limit, isActive);
    const totalCount = await this.userRepository.count(isActive);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      users,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  // Kullanıcı silme (soft delete)
  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.userRepository.delete(userId);
  }

  // Kullanıcı kalıcı silme
  async hardDeleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.userRepository.hardDelete(userId);
  }

  // Email doğrulama
  async verifyEmail(userId: string): Promise<UserProfile> {
    await this.userRepository.verifyEmail(userId);
    
    const user = await this.userRepository.getUserProfile(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Şifre değiştirme
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Mevcut şifre kontrolü
    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Yeni şifreyi hashleme
    const hashedNewPassword = await this.hashPassword(newPassword);

    await this.userRepository.updatePassword(userId, hashedNewPassword);
  }

  // Kullanıcı arama
  async searchUsers(query: string, limit: number = 10): Promise<UserSummary[]> {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    return await this.userRepository.search(query.trim(), limit);
  }

  // Role göre kullanıcıları getirme
  async getUsersByRole(roleId: string): Promise<UserSummary[]> {
    const users = await this.userRepository.findByRole(roleId);
    return users.map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
      role: {
        name: user.role.name,
      },
    }));
  }

//   // Kullanıcının toplantıları
//   async getUserMeetings(userId: string) {
//     const user = await this.userRepository.findById(userId);
//     if (!user) {
//       throw new Error('User not found');
//     }

//     return await this.userRepository.getUserMeetings(userId);
//   }

  // Basit session yönetimi (geliştirme amaçlı)
  async createSession(userId: string): Promise<string> {
    const sessionData = {
      userId,
      timestamp: Date.now(),
    };
    
    // Bu basit bir session token'dır
    // Production'da güvenli token kullanın
    return Buffer.from(JSON.stringify(sessionData)).toString('base64');
  }

  // Session doğrulama
  async validateSession(sessionToken: string): Promise<{ userId: string } | null> {
    try {
      const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
      
      // 24 saat geçerlilik süresi
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - sessionData.timestamp > oneDay) {
        return null;
      }

      // Kullanıcının hala aktif olduğunu kontrol et
      const user = await this.userRepository.findById(sessionData.userId);
      if (!user || !user.isActive) {
        return null;
      }

      return { userId: sessionData.userId };
    } catch (error) {
      return null;
    }
  }

  // Kullanıcı istatistikleri
  async getUserStats() {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count(true);
    const inactiveUsers = totalUsers - activeUsers;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      activePercentage: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
    };
  }
}