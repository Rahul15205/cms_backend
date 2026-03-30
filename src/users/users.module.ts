import { Module } from '@nestjs/common';
import { EncryptionModule } from '../encryption/encryption.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [EncryptionModule],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
