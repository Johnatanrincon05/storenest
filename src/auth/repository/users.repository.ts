/* eslint-disable prettier/prettier */
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@EntityRepository(User)
export class UsersRepository extends Repository<User> {

  async createUser(name: string, email: string, password: string, activationToken: string): Promise<void> {
    const user = this.create({ name, email, password, activationToken });
    try {
      await this.save(user);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('User mail already registered');
      }
      throw new InternalServerErrorException();
    }
  }

  async findOneByEmail(email: string): Promise<User>{
    return this.findOne({ email });
  }

  async activateUser(user: User): Promise <void>{
    user.active = true;
    this.save(user);
  }

  async findOneInactivateByIdAndActivationToken(id: string, code: string): Promise<User>{
    return this.findOne({ id: id, activationToken: code, active: false});
  }

}
