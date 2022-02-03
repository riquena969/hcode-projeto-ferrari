/*
https://docs.nestjs.com/controllers#controllers
*/

import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { parse } from 'date-fns';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {

    constructor(private userService: UserService) { }

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

        return await this.userService.create({
            name,
            email,
            password,
            birthAt,
            document,
            phone
        });
    }
}
