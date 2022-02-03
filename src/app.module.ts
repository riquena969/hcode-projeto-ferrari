import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';

@Module({
  imports: [
    AuthModule,
    UserModule,
    PrismaModule,],
  controllers: [AppController],
  providers: [],
})
export class AppModule { }
