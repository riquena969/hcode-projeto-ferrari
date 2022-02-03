/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Param } from '@nestjs/common';
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
}
