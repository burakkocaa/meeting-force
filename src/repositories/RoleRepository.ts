import { PrismaClient } from '@prisma/client';
import {
  Role,
  RoleWithRelations,
  CreateRoleData,
  UpdateRoleData,
  RoleSummary,
  RoleDetail,
  UserPermissions,
  roleSelectOptions,
  PermissionHelper,
} from '../models/Role';

export class RoleRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Tüm rolleri getir
  async findAll(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      select: roleSelectOptions.full,
      orderBy: { createdAt: 'desc' },
    });
    
    return roles as Role[];
  }

  // Aktif rolleri getir
  async findActive(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      where: { isActive: true },
      select: roleSelectOptions.full,
      orderBy: { name: 'asc' },
    });
    
    return roles as Role[];
  }

  // ID ile rol getir
  async findById(id: string): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: roleSelectOptions.full,
    });
    
    return role as Role | null;
  }

  // İsimle rol getir
  async findByName(name: string): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { name },
      select: roleSelectOptions.full,
    });
    
    return role as Role | null;
  }

  // Kullanıcıları ile birlikte rol getir
  async findByIdWithUsers(id: string): Promise<RoleWithRelations | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
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
    });

    return role as RoleWithRelations | null;
  }

  // Rol detayı getir
  async findDetailById(id: string): Promise<RoleDetail | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
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
    });

    if (!role) return null;

    return {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: role.permissions,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      users: role.users,
    };
  }

  // Rol özeti listesi getir
  async findSummaries(): Promise<RoleSummary[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isActive: role.isActive,
      userCount: role._count.users,
      createdAt: role.createdAt,
    }));
  }

  // Yeni rol oluştur
  async create(data: CreateRoleData): Promise<Role> {
    // Permission'ları validate et
    if (!PermissionHelper.validatePermissions(data.permissions)) {
      throw new Error('Invalid permissions structure');
    }

    // İsim kontrolü
    const existingRole = await this.findByName(data.name);
    if (existingRole) {
      throw new Error(`Role with name '${data.name}' already exists`);
    }

    const role = await this.prisma.role.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        permissions: data.permissions as any,
        isActive: data.isActive ?? true,
      },
      select: roleSelectOptions.full,
    });

    return role as Role;
  }

  // Rol güncelle
  async update(id: string, data: UpdateRoleData): Promise<Role | null> {
    // Rol varlığını kontrol et
    const existingRole = await this.findById(id);
    if (!existingRole) {
      throw new Error(`Role with id '${id}' not found`);
    }

    // İsim değişikliği varsa ve çakışma kontrolü
    if (data.name && data.name !== existingRole.name) {
      const nameConflict = await this.findByName(data.name);
      if (nameConflict && nameConflict.id !== id) {
        throw new Error(`Role with name '${data.name}' already exists`);
      }
    }

    // Permission validation
    if (data.permissions && !PermissionHelper.validatePermissions(data.permissions)) {
      throw new Error('Invalid permissions structure');
    }

    const updateData: any = { ...data };
    if (data.permissions) {
      updateData.permissions = data.permissions as any;
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: updateData,
      select: roleSelectOptions.full,
    });

    return role as Role;
  }

  // Rol sil
  async delete(id: string): Promise<boolean> {
    try {
      // Rol varlığını kontrol et
      const existingRole = await this.findById(id);
      if (!existingRole) {
        throw new Error(`Role with id '${id}' not found`);
      }

      // Kullanıcıları kontrol et
      const usersCount = await this.prisma.user.count({
        where: { roleId: id },
      });

      if (usersCount > 0) {
        throw new Error(`Cannot delete role. ${usersCount} users are assigned to this role`);
      }

      await this.prisma.role.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Rol durumunu değiştir (aktif/pasif)
  async toggleStatus(id: string): Promise<Role | null> {
    const existingRole = await this.findById(id);
    if (!existingRole) {
      throw new Error(`Role with id '${id}' not found`);
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: { isActive: !existingRole.isActive },
      select: roleSelectOptions.full,
    });

    return role as Role;
  }

  // Kullanıcıları role ata
  async assignUsers(roleId: string, userIds: string[]): Promise<void> {
    // Rol varlığını kontrol et
    const role = await this.findById(roleId);
    if (!role) {
      throw new Error(`Role with id '${roleId}' not found`);
    }

    // Kullanıcıları güncelle
    await this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { roleId },
    });
  }

  // Kullanıcıları role'dan çıkar
  async removeUsers(userIds: string[]): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { roleId: null },
    });
  }

  // Belirli permission'a sahip rolleri getir
  async findByPermission(module: string, action: string): Promise<Role[]> {
    const allRoles = await this.findAll();
    
    return allRoles.filter(role => 
      PermissionHelper.hasPermission(role.permissions, module, action)
    );
  }

  // Rol permission'ı kontrol et
  async hasPermission(roleId: string, module: string, action: string): Promise<boolean> {
    const role = await this.findById(roleId);
    if (!role) return false;

    return PermissionHelper.hasPermission(role.permissions, module, action);
  }

  // Rol permission'larını güncelle
  async updatePermissions(roleId: string, permissions: UserPermissions): Promise<Role | null> {
    if (!PermissionHelper.validatePermissions(permissions)) {
      throw new Error('Invalid permissions structure');
    }

    const role = await this.prisma.role.update({
      where: { id: roleId },
      data: { permissions: permissions as any },
      select: roleSelectOptions.full,
    });

    return role as Role;
  }

  // Rol permission'larını birleştir
  async mergePermissions(
    roleId: string, 
    additionalPermissions: UserPermissions
  ): Promise<Role | null> {
    const role = await this.findById(roleId);
    if (!role) {
      throw new Error(`Role with id '${roleId}' not found`);
    }

    const currentPermissions = role.permissions as UserPermissions;
    const mergedPermissions = PermissionHelper.mergePermissions(
      currentPermissions,
      additionalPermissions
    );

    return await this.updatePermissions(roleId, mergedPermissions);
  }

  // Arama
  async search(query: string): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: roleSelectOptions.full,
      orderBy: { createdAt: 'desc' },
    });

    return roles as Role[];
  }

  // Sayfalama ile rolleri getir
  async findPaginated(page: number = 1, limit: number = 10): Promise<{
    roles: RoleSummary[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    
    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.role.count(),
    ]);

    const summaries = roles.map(role => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isActive: role.isActive,
      userCount: role._count.users,
      createdAt: role.createdAt,
    }));

    return {
      roles: summaries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Rol istatistikleri
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withUsers: number;
    withoutUsers: number;
  }> {
    const [total, active, withUsers] = await Promise.all([
      this.prisma.role.count(),
      this.prisma.role.count({ where: { isActive: true } }),
      this.prisma.role.count({
        where: {
          users: {
            some: {},
          },
        },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      withUsers,
      withoutUsers: total - withUsers,
    };
  }

  // Bulk operations
  async bulkUpdateStatus(roleIds: string[], isActive: boolean): Promise<number> {
    const result = await this.prisma.role.updateMany({
      where: { id: { in: roleIds } },
      data: { isActive },
    });

    return result.count;
  }

  // Rol kopyala
  async clone(roleId: string, newName: string, newDisplayName: string): Promise<Role> {
    const originalRole = await this.findById(roleId);
    if (!originalRole) {
      throw new Error(`Role with id '${roleId}' not found`);
    }

    // İsim kontrolü
    const existingRole = await this.findByName(newName);
    if (existingRole) {
      throw new Error(`Role with name '${newName}' already exists`);
    }

    return await this.create({
      name: newName,
      displayName: newDisplayName,
      description: originalRole.description,
      permissions: originalRole.permissions as UserPermissions,
      isActive: originalRole.isActive,
    });
  }
}