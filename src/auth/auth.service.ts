/*
https://docs.nestjs.com/providers#services
*/

import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { join } from 'path';
import { existsSync, renameSync, unlinkSync } from 'fs';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private mailService: MailService,
        private jwtService: JwtService,
        private prisma: PrismaService) { };

    async getToken(userId: number) {
        const { id, email, photo, persons } = await this.userService.get(userId);
        const { name } = persons;

        return this.jwtService.sign({
            id, name, email, photo
        });
    }

    async login({ email, password }: { email: string; password: string }) {
        const user = await this.userService.getByEmail(email, true);

        const checked = await bcrypt.compare(password, user.password);

        if (!checked) {
            throw new UnauthorizedException("E-mail or password is incorrect");
        }

        const token = await this.getToken(user.id);

        return { token };
    }

    async decodeToken(token: string) {
        try {
            await this.jwtService.verify(token);
        } catch (e) {
            throw new UnauthorizedException('Access denied');
        }

        return this.jwtService.decode(token);
    }

    async recoveryPassword(email: string) {
        const { id, persons } = await this.userService.getByEmail(email);
        const { name } = persons;

        const token = await this.jwtService.sign({ id }, {
            expiresIn: "30m"
        });

        await this.prisma.password_recoveries.create({
            data: {
                userId: id,
                token
            }
        });

        await this.mailService.send({
            to: email,
            subject: "Recuperação de senha - Ferrari",
            template: "forget",
            data: {
                name,
                url: `https://devoriginal.com/recovery?token=${token}`
            }
        });

        return { success: true };
    }

    async reset({ password, token }: { password: string; token: string }) {
        if (!password) {
            throw new BadRequestException("Password is required");
        }

        try {
            await this.jwtService.verify(token);
        } catch (error) {
            throw new BadRequestException("Token is invalid");
        }

        const passwordRecovery = await this.prisma.password_recoveries.findFirst({
            where: {
                token,
                resetAt: null
            }
        });

        if (!passwordRecovery) {
            throw new BadRequestException("Token is invalid");
        }

        await this.prisma.password_recoveries.update({
            where: {
                id: passwordRecovery.id
            },
            data: {
                resetAt: new Date()
            }
        });

        return this.userService.updatePassword(passwordRecovery.userId, password);
    }

    async setPhoto(id: number, file: Express.Multer.File) {
        if (file.mimetype.indexOf('image') == -1) {
            unlinkSync(this.getStoragePath(file.filename));
            throw new BadRequestException('Invalid image');
        }

        await this.removePhoto(id);

        const ext = file.mimetype.split('/')[1];
        const filename = `${file.filename}.${ext}`;

        const oldPath = this.getStoragePath(file.filename);
        const newPath = this.getStoragePath(filename);

        renameSync(oldPath, newPath);

        return this.userService.update(id, {
            photo: filename
        });
    }

    async removePhoto(id: number) {
        const { photo } = await this.userService.get(id);

        if (photo) {
            const currentPhoto = this.getStoragePath(photo);

            if (existsSync(currentPhoto)) {
                unlinkSync(currentPhoto);
            }
        }

        return this.userService.update(id, { photo: null });
    }

    getStoragePath(filename: string) {
        return join(__dirname, '../', '../', '../', 'storage', 'photos', filename);
    }
}
