import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
} from '@nestjs/common';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../config/enums';

@Controller('labels')
export class LabelsController {
    constructor(private readonly labelsService: LabelsService) {}

    @Post()
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
    async create(@Body() dto: CreateLabelDto) {
        return this.labelsService.create(dto.name, dto.color);
    }

    @Get()
    async findAll() {
        return this.labelsService.findAll();
    }

    @Patch(':uuid')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
    async update(
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @Body() dto: UpdateLabelDto,
    ) {
        return this.labelsService.update(uuid, dto);
    }

    @Delete(':uuid')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    async remove(@Param('uuid', ParseUUIDPipe) uuid: string) {
        return this.labelsService.remove(uuid);
    }
}
