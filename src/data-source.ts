import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './users/user.entity';
import { TeamMember } from './team/team-member.entity';
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.USERS_DATABASE_URL,
  entities: [User, TeamMember],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
