import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  TeamInvitePayload,
  TeamMember,
  TeamUpdatePayload,
} from '@crm/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { TeamMember as TeamMemberEntity } from './team-member.entity';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
const toTeamMember = (row: TeamMemberEntity): TeamMember => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  status: row.status,
  invitedAt: row.invitedAt?.toISOString() ?? null,
  joinedAt: row.joinedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(TeamMemberEntity)
    private readonly repo: Repository<TeamMemberEntity>,
  ) {}

  async findAll(): Promise<TeamMember[]> {
    const rows = await this.repo.find({
      order: { createdAt: 'ASC' },
    });
    return rows.map(toTeamMember);
  }

  async invite(payload: TeamInvitePayload): Promise<TeamMember> {
    const existing = await this.repo.findOneBy({
      email: payload.email,
    });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const row = await this.repo.save(
      this.repo.create({
        id: randomUUID(),
        email: payload.email,
        role: payload.role,
        name: '',
        status: 'invited',
        invitedAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    return toTeamMember(row);
  }

  async update({ id, ...data }: TeamUpdatePayload): Promise<TeamMember> {
    const member = await this.repo.findOneBy({ id });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const row = await this.repo.save(
      this.repo.merge(member, data, { updatedAt: new Date() }),
    );

    return toTeamMember(row);
  }
}
