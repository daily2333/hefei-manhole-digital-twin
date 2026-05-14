import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ManholesModule } from './manholes/manholes.module';
import { AlarmsModule } from './alarms/alarms.module';
import { MaintenanceModule } from './maintenance/maintenance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    DashboardModule,
    ManholesModule,
    AlarmsModule,
    MaintenanceModule
  ]
})
export class AppModule {}
