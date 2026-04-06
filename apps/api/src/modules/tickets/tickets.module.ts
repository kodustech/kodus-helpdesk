import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketModel } from './entities/ticket.model';
import { LabelModel } from './entities/label.model';
import { TicketLabelModel } from './entities/ticket-label.model';
import { CommentModel } from './entities/comment.model';
import { CommentMentionModel } from './entities/comment-mention.model';
import { TicketActivityModel } from './entities/ticket-activity.model';
import { TicketsService } from './tickets.service';
import { ActivitiesService } from './activities.service';
import { TicketsController } from './tickets.controller';
import { LabelsService } from './labels.service';
import { LabelsController } from './labels.controller';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { UserModel } from '../users/entities/user.model';
import { EditorAssignmentModel } from '../users/entities/editor-assignment.model';
import { CustomerModel } from '../customers/entities/customer.model';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            TicketModel,
            LabelModel,
            TicketLabelModel,
            CommentModel,
            CommentMentionModel,
            TicketActivityModel,
            UserModel,
            EditorAssignmentModel,
            CustomerModel,
        ]),
        NotificationsModule,
    ],
    providers: [TicketsService, LabelsService, CommentsService, ActivitiesService],
    controllers: [TicketsController, LabelsController, CommentsController],
    exports: [TicketsService],
})
export class TicketsModule {}
