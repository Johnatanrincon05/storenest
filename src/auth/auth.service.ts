import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { EncoderService } from './encoder.service';
import { JwtPayload } from './jwt-payload.interface';
import { UsersRepository } from './repository/users.repository';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsersRepository)
    private usersRepository: UsersRepository,
    private encoderService: EncoderService,
    private jwtService: JwtService,
  ) {}
  async registerUser(registerUserDto: RegisterUserDto): Promise<void> {
    const { name, email, password } = registerUserDto;
    const hashedPassword = await this.encoderService.encodePassword(password);
    return this.usersRepository.createUser(name, email, hashedPassword);
  }
  async login(loginDto: LoginDto): Promise<{accessToken: string}> {
    const { email, password } = loginDto;
    const userDatabase = await this.usersRepository.findOneByEmail(email);
    if (
      userDatabase &&
      (await this.encoderService.checkPassword(password, userDatabase.password))
    ) {
      const payload: JwtPayload = { id: userDatabase.id, email, active: userDatabase.active};
      const accessToken = await this.jwtService.sign(payload);

      return { accessToken };
    }
    throw new UnauthorizedException('Bad Credentials');
  }
}
