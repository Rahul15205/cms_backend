import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, tenantId: string) {
    const { roles, password, ...userData } = createUserDto;
    
    const existing = await this.prisma.user.findUnique({ where: { email: userData.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        ...userData,
        tenantId,
        password: hashedPassword,
        roles: {
          create: roles.map(roleId => ({ roleId }))
        }
      },
      include: { roles: true }
    });
  }

  async findAll(filters?: { 
    status?: UserStatus; 
    tenantId?: string; 
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const take = filters?.limit ? Number(filters.limit) : 50;
    const skip = filters?.offset ? Number(filters.offset) : 0;
    const orderBy: any = filters?.sortBy ? { [filters.sortBy]: filters.sortOrder || 'desc' } : { createdAt: 'desc' };

    const [total, data] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        take,
        skip,
        orderBy,
        select: {
          id: true, email: true, name: true, phone: true, status: true, accountType: true,
          department: true, mfaEnabled: true, lastLogin: true, validFrom: true, 
          validUntil: true, tenantId: true, createdAt: true, updatedAt: true,
          roles: { include: { role: { select: { name: true } } } }
        }
      })
    ]);

    return {
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
      data
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        tenant: true,
        roles: { include: { role: { include: { permissions: true } } } }
      }
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { roles, password, ...data } = updateUserDto;
    
    // Check if user exists
    await this.findOne(id);

    const updateData: any = { ...data };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (roles) {
      // Delete existing roles and create new ones
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      updateData.roles = {
        create: roles.map(roleId => ({ roleId }))
      };
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, status: true }
    });
  }

  async updateStatus(id: string, status: UserStatus) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, status: true }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({ 
      where: { id },
      data: { status: UserStatus.DISABLED }
    });
  }
}
