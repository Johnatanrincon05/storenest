import { IsNotEmpty, IsUUID, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsUUID()
  resetPasswordToken: string;

  @IsNotEmpty()
  @Length(6, 20)
  password: string;
}
