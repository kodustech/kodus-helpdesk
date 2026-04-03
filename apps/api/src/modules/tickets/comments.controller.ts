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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserModel } from '../users/entities/user.model';

@Controller('tickets/:ticketUuid/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Post()
    async create(
        @Param('ticketUuid', ParseUUIDPipe) ticketUuid: string,
        @Body() dto: CreateCommentDto,
        @CurrentUser() user: UserModel,
    ) {
        return this.commentsService.create(
            ticketUuid,
            dto.content,
            user,
            dto.mentioned_user_ids,
        );
    }

    @Get()
    async findAll(
        @Param('ticketUuid', ParseUUIDPipe) ticketUuid: string,
    ) {
        return this.commentsService.findByTicket(ticketUuid);
    }

    @Patch(':commentUuid')
    async update(
        @Param('commentUuid', ParseUUIDPipe) commentUuid: string,
        @Body() dto: UpdateCommentDto,
        @CurrentUser() user: UserModel,
    ) {
        return this.commentsService.update(
            commentUuid,
            dto.content,
            user,
            dto.mentioned_user_ids,
        );
    }

    @Delete(':commentUuid')
    async remove(
        @Param('commentUuid', ParseUUIDPipe) commentUuid: string,
        @CurrentUser() user: UserModel,
    ) {
        await this.commentsService.remove(commentUuid, user);
        return { message: 'Comment deleted' };
    }
}
