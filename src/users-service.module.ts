import { Module } from '@nestjs/common';
import { TeamService } from './team/team.service';
import { UsersController } from './users/users.controller';
import { TeamController } from './team/team.controller';
import { UsersService } from './users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './data-source';
import { User } from './users/user.entity';
import { TeamMember } from './team/team-member.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    TypeOrmModule.forFeature([User, TeamMember]),
  ],
  controllers: [UsersController, TeamController],
  providers: [UsersService, TeamService],
})
export class UsersServiceModule {}
