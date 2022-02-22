import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { createReadStream } from 'fs';
import { join } from 'path';
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async get(id: number, hash: boolean = false) {
    id = Number(id);

    if (isNaN(id)) {
      throw new BadRequestException('ID is required');
    }

    let user = await this.prisma.users.findUnique({
      where: {
        id,
      },
      include: {
        persons: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!hash) {
      delete user.password;
    }

    return user;
  }

  async getByEmail(email: string, hash: boolean = false) {
    if (!email) {
      throw new BadRequestException('E-mail is required');
    }

    let user = await this.prisma.users.findUnique({
      where: {
        email,
      },
      include: {
        persons: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!hash) {
      delete user.password;
    }

    return user;
  }

  async create({
    name,
    password,
    email,
    birthAt,
    phone,
    document,
  }: {
    name: string;
    email: string;
    password: string;
    birthAt?: Date;
    phone?: string;
    document?: string;
  }) {
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    if (!email) {
      throw new BadRequestException('E-mail is required');
    }

    if (!password) {
      throw new BadRequestException('Password is required');
    }

    if (birthAt && birthAt.toString().toLowerCase() === 'invalid date') {
      throw new BadRequestException('Birth date is invalid');
    }

    let user = null;
    try {
      user = await this.getByEmail(email);
    } catch (e) {}

    if (user) {
      throw new BadRequestException('E-mail already exists');
    }

    const userCreated = await this.prisma.users.create({
      data: {
        persons: {
          create: {
            name,
            birthAt,
            phone,
            document,
          },
        },
        email,
        password: bcrypt.hashSync(password, 10),
      },
      include: {
        persons: true,
      },
    });

    delete userCreated.password;

    return userCreated;
  }

  async update(
    id: number,
    {
      name,
      email,
      birthAt,
      phone,
      photo,
      document,
    }: {
      name?: string;
      email?: string;
      birthAt?: Date;
      phone?: string;
      photo?: string;
      document?: string;
    },
  ) {
    id = Number(id);

    if (isNaN(id)) {
      throw new BadRequestException('ID is required');
    }

    let user = null;
    try {
      user = await this.get(id);
    } catch (e) {}

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const dataPerson = {} as Prisma.personsUpdateInput;
    const dataUser = {} as Prisma.usersUpdateInput;

    if (name) {
      dataPerson.name = name;
    }

    if (birthAt) {
      dataPerson.birthAt = birthAt;
    }

    if (phone) {
      dataPerson.phone = phone;
    }

    if (document) {
      dataPerson.document = document;
    }

    if (photo) {
      dataUser.photo = photo;
    }

    if (email) {
      dataUser.email = email;
    }

    if (dataPerson) {
      await this.prisma.persons.update({
        where: {
          id: user.persons.id,
        },
        data: dataPerson,
      });
    }

    if (dataUser) {
      await this.prisma.users.update({
        where: {
          id,
        },
        data: dataUser,
      });
    }

    return this.get(id);
  }

  async getPhoto(id: number) {
    let { photo } = await this.get(id);

    if (!photo) {
      photo = '../no-photo.png';
    }

    const ext = photo.split('.').pop();

    const file = createReadStream(this.getStoragePath(photo));

    return {
      file,
      ext,
    };
  }

  getStoragePath(filename: string) {
    return join(__dirname, '../', '../', '../', 'storage', 'photos', filename);
  }
}
