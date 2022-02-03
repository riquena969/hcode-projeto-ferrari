/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private userService: UserService, private jwtService: JwtService) { };

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
}
