import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'manhole-digital-twin-api',
      timestamp: new Date().toISOString()
    };
  }
}
