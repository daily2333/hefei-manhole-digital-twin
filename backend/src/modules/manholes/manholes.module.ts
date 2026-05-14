import { Module } from '@nestjs/common';
import { ManholesController } from './manholes.controller';
import { ManholesService } from './manholes.service';

@Module({
  controllers: [ManholesController],
  providers: [ManholesService]
})
export class ManholesModule {}
