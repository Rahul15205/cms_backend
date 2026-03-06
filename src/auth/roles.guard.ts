import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, RequiredPermission } from './permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true; // No permissions required
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    // Fetch user permissions through roles
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.userId }, // from JWT payload
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    });

    for (const requiredPerm of requiredPermissions) {
      const hasPermission = userRoles.some(ur => {
        const matchingModulePerm = ur.role.permissions.find(p => p.module === requiredPerm.module);
        if (!matchingModulePerm) return false;
        
        // e.g. requiredPerm.action = 'view', check if p.view is true
        return matchingModulePerm[requiredPerm.action] === true;
      });

      if (!hasPermission) {
        throw new ForbiddenException(`Missing permission: ${requiredPerm.action} on module ${requiredPerm.module}`);
      }
    }

    return true;
  }
}
