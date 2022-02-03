/*
https://docs.nestjs.com/providers#services
*/

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {

    constructor(private prisma: PrismaService) { }

    async get(id: number) {
        id = Number(id);

        if (isNaN(id)) {
            throw new BadRequestException("ID is required");
        }

        let user = await this.prisma.users.findUnique({
            where: {
                id
            },
            include: {
                persons: true
            }
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        return user;
    }

    async getByEmail(email: string) {
        if (!email) {
            throw new BadRequestException("E-mail is required");
        }

        let user = await this.prisma.users.findUnique({
            where: {
                email
            },
            include: {
                persons: true
            }
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        return user;
    }

    async create({ name,
        password,
        email,
        birthAt,
        phone,
        document }
        :
        {
            name: string;
            email: string;
            password: string;
            birthAt?: Date;
            phone?: string;
            document?: string
        }) {

        if (!name) {
            throw new BadRequestException("Name is required");
        }

        if (!email) {
            throw new BadRequestException("E-mail is required");
        }

        if (!password) {
            throw new BadRequestException("Password is required");
        }

        if (birthAt && birthAt.toString().toLowerCase() === 'invalid date') {
            throw new BadRequestException("Birth date is invalid");
        }

        let user = null;
        try {
            user = await this.getByEmail(email);
        } catch (e) { }

        if (user) {
            throw new BadRequestException("E-mail already exists");
        }

        return this.prisma.users.create({
            data: {
                persons: {
                    create: {
                        name,
                        birthAt,
                        phone,
                        document,
                    }
                },
                email,
                password
            },
            include: {
                persons: true
            }
        })
    }
}
