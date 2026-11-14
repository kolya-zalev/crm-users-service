import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  getPermissionsForRole,
  getRolesWithPermission,
  permissions,
  type AssignableUser,
  type Permission,
  type PublicUser,
  type UpsertUserPayload,
  type UpdateMePayload,
  type UserRef,
} from '@crm/shared';
import { nextEmailChangeAt } from './users-email.constants';
import { InjectRepository } from '@nestjs/typeorm';
import { User as UserEntity } from './user.entity';
import { Repository, In } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private readonly repo: Repository<UserEntity>,
  ) {}

  listAssignable(): Promise<AssignableUser[]> {
    return this.repo.find({
      where: {
        role: In(getRolesWithPermission(permissions.leadBeAssigned)),
      },
      select: { id: true, name: true, role: true },
      order: { name: 'ASC' },
    });
  }
  async upsert({ id, email, name, role }: UpsertUserPayload): Promise<UserRef> {
    await this.repo.upsert({ id, email, name, role, updatedAt: new Date() }, [
      'id',
    ]);

    return { id, name };
  }

  async getAssignable(id: string): Promise<UserRef> {
    const user = await this.repo.findOneBy({
      id,
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    const canBeAssigned = getPermissionsForRole(user.role).includes(
      permissions.leadBeAssigned,
    );
    if (!canBeAssigned) {
      throw new BadRequestException('User cannot be assigned to a lead');
    }
    return { id: user.id, name: user.name };
  }

  async findByIds(ids: string[]): Promise<UserRef[]> {
    if (ids.length === 0) return [];
    return this.repo.find({
      where: {
        id: In([...new Set(ids)]),
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  findByPermission(permission: Permission): Promise<{ id: string }[]> {
    return this.repo.find({
      where: {
        role: In(getRolesWithPermission(permission)),
      },
      select: {
        id: true,
      },
    });
  }
  listAll(): Promise<UserRef[]> {
    return this.repo.find({
      select: {
        id: true,
        name: true,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  private async requireUser(userId: string) {
    const user = await this.repo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException();
    return user;
  }

  private toPublic(user: {
    id: string;
    name: string;
    email: string;
    role: string;
    emailChangedAt: Date | null;
  }): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailChangedAt: user.emailChangedAt?.toISOString() ?? null,
      nextEmailChangeAt:
        nextEmailChangeAt(user.emailChangedAt, new Date())?.toISOString() ??
        null,
    };
  }

  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.requireUser(userId);
    return this.toPublic(user);
  }

  async updateMe({
    userId,
    name,
    email,
  }: UpdateMePayload): Promise<PublicUser> {
    const user = await this.requireUser(userId);
    const data: {
      name?: string;
      email?: string;
      emailChangedAt?: Date;
    } = {};

    if (name !== undefined) {
      data.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const unlockAt = nextEmailChangeAt(user.emailChangedAt, new Date());
        if (unlockAt) {
          throw new BadRequestException({
            message: `Email can be changed again on ${unlockAt.toISOString()}`,
            nextChangeAt: unlockAt.toISOString(),
          });
        }
        const taken = await this.repo.findOneBy({
          email: normalizedEmail,
        });
        if (taken) {
          throw new ConflictException('Email already exist');
        }
        data.email = normalizedEmail;
        data.emailChangedAt = new Date();
      }
    }
    const updated = await this.repo.save(
      this.repo.merge(user, data, { updatedAt: new Date() }),
    );

    return this.toPublic(updated);
  }
}
