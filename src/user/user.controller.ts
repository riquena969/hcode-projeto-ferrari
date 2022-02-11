/*
https://docs.nestjs.com/controllers#controllers
*/

import { BadRequestException, Body, Controller, Get, Param, Put } from '@nestjs/common';
import { parse } from 'date-fns';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
    constructor(private userService: UserService) { }

    @Get(":id")
    async show(@Param('id') id) {
        return this.userService.get(id);
    }

    @Get("email/:email")
    async showByEmail(@Param('email') email) {
        return this.userService.getByEmail(email);
    }

    @Put(':id')
    async register(@Param('id') id,
        @Body('name') name,
        @Body('email') email,
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

        return await this.userService.update(id, {
            name,
            email,
            birthAt,
            document,
            phone
        });
    }
}
