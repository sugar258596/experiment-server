import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { LabService } from './lab.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { SearchLabDto } from './dto/search-lab.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@Controller('labs')
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createLabDto: CreateLabDto) {
    return this.labService.create(createLabDto);
  }

  @Get()
  findAll(@Query() searchDto: SearchLabDto) {
    return this.labService.findAll(searchDto);
  }

  @Get('popular')
  getPopularLabs(@Query('limit') limit?: number) {
    return this.labService.getPopularLabs(limit ? +limit : 6);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.labService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateLabDto: UpdateLabDto) {
    return this.labService.update(id, updateLabDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.labService.remove(id);
  }
}
