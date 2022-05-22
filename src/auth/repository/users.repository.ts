/* eslint-disable prettier/prettier */
import { EntityRepository, Repository } from 'typeorm';
import { RegisterUserDto } from '../dto/register-user.dto';
import { User } from '../entities/user.entity';

@EntityRepository(User)
export class UsersRepository extends Repository<User> {
  
  async createUser(registerUserDto:RegisterUserDto):Promise<void> {}

}
