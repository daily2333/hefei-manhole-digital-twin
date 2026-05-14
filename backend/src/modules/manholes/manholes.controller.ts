import { Controller, Get, Param } from '@nestjs/common';
import { ManholesService } from './manholes.service';

@Controller('manholes')
export class ManholesController {
  constructor(private readonly manholesService: ManholesService) {}

  @Get()
  findAll() {
    return this.manholesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.manholesService.findOne(id);
  }
}
