/*
https://docs.nestjs.com/controllers#controllers
*/

import { BadRequestException, Body, Controller, Get, Header, Headers, Post, Put, Res, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

    @Post("/forget")
    async forget(@Body('email') email: string) {
        return this.authService.recoveryPassword(email);
    }

    @Post("password-reset")
    async reset(@Body('token') token: string, @Body('password') password: string) {
        return this.authService.reset({ token, password });
    }

    @Put('profile-picture')
    @UseGuards(AuthGuard)
    @UseInterceptors(FileInterceptor('file', {
        dest: './storage/photos',
        limits: {
            fileSize: 5 * 1024 * 1024
        }
    }))
    async setPhoto(@User() user, @UploadedFile() file: Express.Multer.File) {
        return this.authService.setPhoto(Number(user.id), file);
    }

    @Get('photo')
    @UseGuards(AuthGuard)
    async getPhoto(@User('id') id, @Res({ passthrough: true }) res) {
        const { file, ext } = await this.userService.getPhoto(id);

        res.set({ "Content-type": `image/${ext}` });

        return new StreamableFile(file);
    }
}
