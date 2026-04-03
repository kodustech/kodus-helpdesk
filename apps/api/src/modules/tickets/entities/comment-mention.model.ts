import { Entity, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { CoreModel } from '../../../config/database/core.model';
import { CommentModel } from './comment.model';
import { UserModel } from '../../users/entities/user.model';

@Entity('comment_mentions')
@Unique('UQ_comment_mention', ['comment', 'mentionedUser'])
export class CommentMentionModel extends CoreModel {
    @ManyToOne(() => CommentModel, (c) => c.mentions, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'comment_id' })
    comment: CommentModel;

    @ManyToOne(() => UserModel, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'mentioned_user_id' })
    mentionedUser: UserModel;
}
