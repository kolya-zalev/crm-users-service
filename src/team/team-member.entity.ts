import {
  Entity,
  Column,
  Index,
  CreateDateColumn,
  PrimaryColumn,
} from 'typeorm';

@Entity('TeamMember')
export class TeamMember {
  @PrimaryColumn({ type: 'text', primaryKeyConstraintName: 'TeamMember_pkey' })
  id: string;

  @Column({ type: 'text', default: '' })
  name: string;

  @Column({ type: 'text' })
  @Index('TeamMember_email_key', { unique: true })
  email: string;

  @Column({ type: 'text' })
  role: string;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'timestamp', nullable: true, precision: 3 })
  invitedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, precision: 3 })
  joinedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp', precision: 3 })
  createdAt: Date;

  @Column({ type: 'timestamp', precision: 3 })
  updatedAt: Date;
}
