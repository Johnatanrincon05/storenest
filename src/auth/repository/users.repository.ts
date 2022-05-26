/* eslint-disable prettier/prettier */
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { RegisterUserDto } from '../dto/register-user.dto';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@EntityRepository(User)
export class UsersRepository extends Repository<User> {

  async createUser(registerUserDto: RegisterUserDto): Promise<void> {
    const { name, email, password } = registerUserDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.create({ name, email, password: hashedPassword });

    try {
      await this.save(user);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('User mail already registered');
      }
      throw new InternalServerErrorException();
    }
  }

}
