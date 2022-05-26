import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { EncoderService } from './encoder.service';
import { User } from './entities/user.entity';
import { UsersRepository } from './repository/users.repository';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsersRepository)
    private usersRepository: UsersRepository,
    private encoderService: EncoderService,
  ) {}
  async registerUser(registerUserDto: RegisterUserDto): Promise<void> {
    const { name, email, password } = registerUserDto;
    const hashedPassword = await this.encoderService.encodePassword(password);
    return this.usersRepository.createUser(name, email, hashedPassword);
  }
  async login(loginDto: LoginDto): Promise<string> {
    const { email, password } = loginDto;
    const userDatabase = await this.usersRepository.findOneByEmail(email);
    if (
      userDatabase &&
      (await this.encoderService.checkPassword(password, userDatabase.password))
    ) {
      return 'Logged';
    }
    throw new UnauthorizedException('Bad Credentials');
  }
}
