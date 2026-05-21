import { Module } from '@nestjs/common';
import { EncryptionModule } from '../encryption/encryption.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [EncryptionModule, NotificationsModule],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
