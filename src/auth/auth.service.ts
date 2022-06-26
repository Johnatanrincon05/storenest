import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { EncoderService } from './encoder.service';
import { JwtPayload } from './jwt-payload.interface';
import { UsersRepository } from './repository/users.repository';
import { v4 } from 'uuid';
import { ActivateUserDto } from './dto/activate-user.dto';
import { User } from './entities/user.entity';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';

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
    const activationToken = v4();
    return this.usersRepository.createUser(
      name,
      email,
      hashedPassword,
      activationToken,
    );
  }
  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { email, password } = loginDto;
    const userDatabase = await this.usersRepository.findOneByEmail(email);
    if (
      userDatabase &&
      (await this.encoderService.checkPassword(password, userDatabase.password))
    ) {
      const payload: JwtPayload = {
        id: userDatabase.id,
        email,
        active: userDatabase.active,
      };
      const accessToken = await this.jwtService.sign(payload);

      return { accessToken };
    }
    throw new UnauthorizedException('Bad Credentials');
  }

  async activateUser(activateUserDto: ActivateUserDto): Promise<void> {
    const { id, code } = activateUserDto;
    const user: User =
      await this.usersRepository.findOneInactivateByIdAndActivationToken(
        id,
        code,
      );

    if (!user) {
      throw new UnprocessableEntityException('This action can not be done');
    }

    this.usersRepository.activateUser(user);
  }

  async requestResetPassword(
    requestResetPasswordDto: RequestResetPasswordDto,
  ): Promise<void> {
    console.log('a');
  }
}
