import { Injectable } from "@nestjs/common";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";
import { DataSource } from "typeorm";
import { CommentRepository } from "./comment.repository";
import { makeLogTitle } from "../../utils/user-logs-utils";
import { ServerError } from "../../common/exceptions/server-error.exception";
import { Comment } from "./entities/comment.entity";
import { Log } from "../log/entities/log.entity";
import { CommentsDto, ReadCommentQuery } from "./dto/read-comment.dto";
import { DeleteCommentReq } from "./dto/delete-comment.dto";
import {
	COMMENT_ERROR_CODES,
	COMMENT_ERROR_MESSAGES,
} from "./constant/comment.constants";

@Injectable()
export class CommentService {
	constructor(
		private dataSource: DataSource,
		private commentRepository: CommentRepository
	) {}

	async createComment(createCommentDto: CreateCommentDto): Promise<void> {
		const queryRunner = this.dataSource.createQueryRunner();
		let isTransactionStarted = false;

		try {
			let { authorId, content, post_id: postId } = createCommentDto;

			const logTitle = makeLogTitle(content);
			const logValue = Object.assign(new Log(), {
				title: logTitle,
				userId: authorId,
				categoryId: 2,
			});

			await queryRunner.connect();
			await queryRunner.startTransaction();
			isTransactionStarted = true;

			const newComment = Object.assign(new Comment(), {
				content,
				post: postId,
				author: authorId,
			});

			await queryRunner.manager.save(newComment);
			await queryRunner.manager.getRepository(Log).save(logValue);
			await queryRunner.commitTransaction();

			return;
		} catch (err) {
			if (isTransactionStarted) {
				await queryRunner.rollbackTransaction();
			}
			if (
				err?.code === COMMENT_ERROR_CODES.NO_REFERENCE &&
				err?.sqlMessage?.includes("post_id")
			) {
				throw ServerError.notFound(
					COMMENT_ERROR_MESSAGES.NOT_FOUND_POST_ID
				);
			} else {
				throw err;
			}
		} finally {
			await queryRunner.release();
		}
	}

	async getTotal(postId: number): Promise<number> {
		const total = await this.commentRepository.getTotalComments(postId);

		return total;
	}

	async readComments(
		readCommentsDto: ReadCommentQuery
	): Promise<CommentsDto[]> {
		return await this.commentRepository.getComments(readCommentsDto);
	}

	async updateComment(updateCommentDto: UpdateCommentDto): Promise<boolean> {
		const { id, authorId, content } = updateCommentDto;

		const result = await this.commentRepository.update(
			{ id, author: authorId, isDelete: false },
			{ content }
		);

		if (result.affected) {
			return true;
		} else {
			throw ServerError.reference(
				COMMENT_ERROR_MESSAGES.UPDATE_COMMENT_ERROR
			);
		}
	}

	async deleteComment(deleteCommentDto: DeleteCommentReq): Promise<boolean> {
		const { id, authorId } = deleteCommentDto;

		const result = await this.commentRepository.update(
			{ id, isDelete: false, author: authorId },
			{ isDelete: true }
		);

		if (result.affected) {
			return true;
		} else {
			throw ServerError.reference(
				COMMENT_ERROR_MESSAGES.DELETE_COMMENT_ERROR
			);
		}
	}
}
