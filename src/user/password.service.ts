import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from './user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  constructor(
    private userService: UserService,
    private mailService: MailService,
    private prisma: PrismaService,
  ) {}

  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string,
  ) {
    if (!newPassword) {
      throw new BadRequestException('New password is required');
    }

    const user = await this.userService.get(id, true);

    const checked = await bcrypt.compare(currentPassword, user.password);

    if (!checked) {
      throw new UnauthorizedException('Current password is invalid');
    }

    return this.updatePassword(user.id, newPassword);
  }

  async updatePassword(id: number, password: string) {
    const user = await this.userService.get(id, true);

    const userUpdated = await this.prisma.users.update({
      where: {
        id,
      },
      data: {
        password: bcrypt.hashSync(password, 10),
      },
    });

    delete userUpdated.password;

    await this.mailService.send({
      to: user.email,
      subject: 'Senha alterada com sucesso',
      template: 'reset-password-confirm',
      data: {
        name: user.persons.name,
      },
    });

    return userUpdated;
  }
}
