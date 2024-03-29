import {
  BadRequestException,
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
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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
    const userDatabase: User = await this.usersRepository.findOneByEmail(email);
    if (
      await this.encoderService.checkPassword(password, userDatabase.password)
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
    const { email } = requestResetPasswordDto;
    const user: User = await this.usersRepository.findOneByEmail(email);
    user.resetPasswordToken = v4();
    this.usersRepository.save(user);
    //Pending send the email
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { resetPasswordToken, password } = resetPasswordDto;
    const user: User = await this.usersRepository.findOneByResetPasswordToken(
      resetPasswordToken,
    );
    user.password = await this.encoderService.encodePassword(password);
    user.resetPasswordToken = null;
    this.usersRepository.save(user);
  }

  async changePassword(
    ChangePasswordDto: ChangePasswordDto,
    user: User,
  ): Promise<void> {
    const { oldPassword, newPassword } = ChangePasswordDto;
    if (await this.encoderService.checkPassword(oldPassword, user.password)) {
      user.password = await this.encoderService.encodePassword(newPassword);
      this.usersRepository.save(user);
    } else {
      throw new BadRequestException('Old password does not match');
    }
  }
}
