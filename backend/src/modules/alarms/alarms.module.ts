import { Module } from '@nestjs/common';
import { AlarmsController } from './alarms.controller';
import { AlarmsService } from './alarms.service';

@Module({
  controllers: [AlarmsController],
  providers: [AlarmsService]
})
export class AlarmsModule {}
