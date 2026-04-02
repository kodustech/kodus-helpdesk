import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { CustomerModel } from './entities/customer.model';
import { EditorAssignmentModel } from '../users/entities/editor-assignment.model';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CustomerModel, EditorAssignmentModel]),
        UsersModule,
    ],
    providers: [CustomersService],
    controllers: [CustomersController],
    exports: [CustomersService],
})
export class CustomersModule {}
