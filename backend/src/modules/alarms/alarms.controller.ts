import { Controller, Get } from '@nestjs/common';
import { AlarmsService } from './alarms.service';

@Controller('alarms')
export class AlarmsController {
  constructor(private readonly alarmsService: AlarmsService) {}

  @Get()
  findAll() {
    return this.alarmsService.findAll();
  }
}
