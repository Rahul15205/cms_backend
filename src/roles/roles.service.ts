import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ModuleName } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  private removeUserSetupPermissions(permissions?: any[], roleName?: string) {
    if (roleName?.trim().toLowerCase() === 'admin') {
      return permissions || [];
    }

    return (permissions || []).filter((permission) => permission.module !== ModuleName.USER_SETUP);
  }

  async create(createRoleDto: CreateRoleDto, tenantId: string) {
    const { permissions, ...roleData } = createRoleDto;
    const allowedPermissions = this.removeUserSetupPermissions(permissions, roleData.name);

    return this.prisma.role.create({
      data: {
        ...roleData,
        tenantId,
        permissions: {
          create: allowedPermissions,
        },
      },
      include: { permissions: true },
    });
  }

  findAll() {
    return this.prisma.role.findMany({
      include: { permissions: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const { permissions, ...roleData } = updateRoleDto;

    const existingRole = await this.findOne(id); // Ensure it exists
    const roleName = roleData.name || existingRole.name;
    const allowedPermissions = this.removeUserSetupPermissions(permissions, roleName);

    if (permissions && roleName.trim().toLowerCase() === 'admin') {
      const existingUserSetupPermission = existingRole.permissions.find(
        (permission) => permission.module === ModuleName.USER_SETUP,
      );

      if (
        existingUserSetupPermission &&
        !allowedPermissions.some((permission) => permission.module === ModuleName.USER_SETUP)
      ) {
        const { id: _id, roleId: _roleId, ...permissionData } = existingUserSetupPermission;
        allowedPermissions.push(permissionData);
      }
    }

    if (permissions) {
      // If updating permissions, clear old ones and recreate to ensure clean sync
      await this.prisma.permission.deleteMany({ where: { roleId: id } });
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        ...roleData,
        ...(permissions ? { permissions: { create: allowedPermissions } } : {})
      },
      include: { permissions: true },
    });
  }

  async remove(id: string) {
    const role = await this.findOne(id);

    if (role.isSystemRole) {
      throw new BadRequestException('Cannot delete a system role');
    }

    return this.prisma.role.delete({ where: { id } });
  }
}
