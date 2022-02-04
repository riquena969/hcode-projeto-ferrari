/*
https://docs.nestjs.com/controllers#controllers
*/

import { BadRequestException, Body, Controller, Get, Header, Headers, Post, Put, UseGuards } from '@nestjs/common';
import { parse } from 'date-fns';
import { User } from 'src/user/user.decorator';
import { UserService } from 'src/user/user.service';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {

    constructor(private userService: UserService, private authService: AuthService) { }

    @Post()
    async verifyEmail(@Body('email') email: string) {
        try {
            await this.userService.getByEmail(email);

            return { exists: true };
        } catch (e) {
            return { exists: false };
        }
    }

    @Post("register")
    async register(@Body('name') name,
        @Body('email') email,
        @Body('password') password,
        @Body('birthAt') birthAt,
        @Body('document') document,
        @Body('phone') phone
    ) {
        if (birthAt) {
            try {
                birthAt = parse(birthAt, 'yyyy-MM-dd', new Date());
            } catch (e) {
                throw new BadRequestException("Birth date is invalid");
            }
        }

        const user = await this.userService.create({
            name,
            email,
            password,
            birthAt,
            document,
            phone
        });

        const token = await this.authService.getToken(user.id);

        return { user, token };
    }

    @Post('login')
    async login(@Body('email') email: string, @Body('password') password: string) {
        return this.authService.login({ email, password });
    }

    @Put('profile')
    @UseGuards(AuthGuard)
    async updateProfile(@User() user, @Body() body) {

        if (body.birthAt) {
            body.birthAt = parse(body.birthAt, 'yyyy-MM-dd', new Date());
        }

        return this.userService.update(user.id, body)
    }

    @Put('password')
    @UseGuards(AuthGuard)
    async updatePassword(@User() user, @Body('currentPassword') currentPassword: string, @Body('newPassword') newPassword: string) {

        return this.userService.changePassword(user.id, currentPassword, newPassword);
    }

    @Get('me')
    @UseGuards(AuthGuard)
    async me(@User() user) {
        return { user };
    }
}
