import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabelModel } from './entities/label.model';

@Injectable()
export class LabelsService {
    constructor(
        @InjectRepository(LabelModel)
        private readonly labelRepository: Repository<LabelModel>,
    ) {}

    async create(name: string, color: string): Promise<LabelModel> {
        const existing = await this.labelRepository.findOne({ where: { name } });
        if (existing) {
            throw new ConflictException('A label with this name already exists');
        }

        const label = this.labelRepository.create({ name, color });
        return this.labelRepository.save(label);
    }

    async findAll(): Promise<LabelModel[]> {
        return this.labelRepository.find({ order: { name: 'ASC' } });
    }

    async findByUuid(uuid: string): Promise<LabelModel> {
        const label = await this.labelRepository.findOne({ where: { uuid } });
        if (!label) {
            throw new NotFoundException('Label not found');
        }
        return label;
    }

    async update(uuid: string, data: Partial<LabelModel>): Promise<LabelModel> {
        const label = await this.findByUuid(uuid);

        if (data.name && data.name !== label.name) {
            const existing = await this.labelRepository.findOne({
                where: { name: data.name },
            });
            if (existing) {
                throw new ConflictException('A label with this name already exists');
            }
        }

        Object.assign(label, data);
        return this.labelRepository.save(label);
    }

    async remove(uuid: string): Promise<void> {
        const label = await this.findByUuid(uuid);
        await this.labelRepository.remove(label);
    }
}
