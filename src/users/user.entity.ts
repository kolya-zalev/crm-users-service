import {
  Entity,
  Column,
  Index,
  CreateDateColumn,
  PrimaryColumn,
} from 'typeorm';

@Entity('User')
export class User {
  @PrimaryColumn({ type: 'text', primaryKeyConstraintName: 'User_pkey' })
  id: string;

  @Column({ type: 'text' })
  @Index('User_email_key', { unique: true })
  email: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', default: 'member' })
  role: string;

  @CreateDateColumn({ type: 'timestamp', precision: 3 })
  createdAt: Date;

  @Column({ type: 'timestamp', precision: 3 })
  updatedAt: Date;

  @Column({ type: 'timestamp', precision: 3, nullable: true })
  emailChangedAt: Date | null;
}
