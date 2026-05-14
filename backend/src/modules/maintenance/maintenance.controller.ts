import { Controller, Get } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance-records')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  findAll() {
    return this.maintenanceService.findAll();
  }
}
