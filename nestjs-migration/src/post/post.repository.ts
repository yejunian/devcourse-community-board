import { Injectable } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { IAdminPostResponse } from "shared";
import { Brackets, DataSource, Repository } from "typeorm";
import { GetPostsDto } from "../admin/dto/get-posts.dto";
import { Like } from "../like/entities/like.entity";
import { getPostHeadersDto } from "./dto/get-post-headers.dto";
import { ReadPostsQueryDto, SortBy } from "./dto/read-posts-query.dto";
import { Post } from "./entities/post.entity";

@Injectable()
export class PostRepository extends Repository<Post> {
	constructor(private dataSource: DataSource) {
		super(Post, dataSource.createEntityManager());
	}

	async getPostHeaders(
		readPostsQueryDto: ReadPostsQueryDto,
		userId: number
	): Promise<getPostHeadersDto[]> {
		let { index, perPage, keyword, sortBy } = readPostsQueryDto;
		index = index > 0 ? index - 1 : 0;

		const queryBuilder = this.createQueryBuilder("post")
			.leftJoinAndSelect("post.author", "user")
			.select([
				"post.id as id",
				"title",
				"user.nickname as author_nickname",
				"post.created_at as created_at",
				"views",
			])
			.addSelect(
				subQuery =>
					subQuery
						.select("COUNT(*)")
						.from(Like, "likes")
						.where("likes.post_id = post.id"),
				"likes"
			)
			.where("post.is_delete = :isDelete", { isDelete: false })
			.andWhere(
				new Brackets(qb => {
					qb.where("post.is_private = :isPrivateFalse", {
						isPrivateFalse: false,
					}).orWhere(
						"post.is_private = :isPrivateTrue AND post.author_id = :authorId",
						{
							isPrivateTrue: true,
							authorId: userId,
						}
					);
				})
			);

		if (keyword) {
			queryBuilder.andWhere("post.title LIKE :keyword", {
				keyword: `%${keyword.trim()}%`,
			});
		}

		if (sortBy === SortBy.LIKES) {
			queryBuilder.orderBy("post.likes", "DESC");
		} else if (sortBy === SortBy.VIEWS) {
			queryBuilder.orderBy("post.views", "DESC");
		} else {
			queryBuilder.orderBy("post.created_at", "DESC");
		}

		queryBuilder
			.addOrderBy("user.id", "ASC")
			.limit(perPage)
			.offset(index * perPage);

		const results = await queryBuilder.getRawMany();

		return plainToInstance(getPostHeadersDto, results);
	}

	async getPostTotal(
		readPostsQueryDto: ReadPostsQueryDto,
		userId: number
	): Promise<number> {
		let { keyword } = readPostsQueryDto;
		userId ? userId : 0;

		const queryBuilder = this.createQueryBuilder("post")
			.leftJoinAndSelect("post.author", "user")
			.where("post.is_delete = :isDelete", { isDelete: false })
			.andWhere(
				new Brackets(qb => {
					qb.where("post.is_private = :isPrivateFalse", {
						isPrivateFalse: false,
					}).orWhere(
						"post.is_private = :isPrivateTrue AND post.author_id = :authorId",
						{
							isPrivateTrue: true,
							authorId: userId,
						}
					);
				})
			);
		if (keyword) {
			queryBuilder.andWhere("post.title LIKE :keyword", {
				keyword: `%${keyword.trim()}%`,
			});
		}

		return await queryBuilder.getCount();
	}

	async getPostHeader(postId: number, userId: number): Promise<Post> {
		const authorId = userId;
		const queryBuilder = this.createQueryBuilder("post")
			.select([
				"post.id as id",
				"title",
				"content",
				"author_id",
				"user.nickname as author_nickname",
				"(post.author_id = :authorId) AS is_author",
				"post.created_at as created_at",
				"post.updated_at as updated_at",
				"views",
				`EXISTS(
                    SELECT 1
                    FROM post_likes AS pl
                    WHERE pl.post_id = post.id AND pl.user_id = :userId
                ) AS user_liked`,
			])
			.addSelect(
				subQuery =>
					subQuery.select("COUNT(*)").from(Like, "post_likes"),
				"likes"
			)
			.leftJoin("post.author", "user")
			.where("post.is_delete = :isPostDeleted", { isPostDeleted: false })
			.andWhere("user.is_delete = :isUserDeleted", {
				isUserDeleted: false,
			})
			.andWhere("post.id = :postId", { postId: postId })
			.setParameters({ authorId, userId });

		return await queryBuilder.getRawOne();
	}

	async getAdminPosts(getPostsDto: GetPostsDto): Promise<IAdminPostResponse> {
		const { index, perPage, keyword } = getPostsDto;

		const queryBuilder = this.createQueryBuilder("post")
			.select([
				"post.id",
				"post.title",
				"user.nickname as author",
				"post.created_at",
				"post.is_delete",
				"post.is_private",
			])
			.leftJoin("post.author", "user")
			.where("post.is_delete = :isDelete", { isDelete: false });

		if (keyword) {
			queryBuilder.andWhere("post.title LIKE :keyword", {
				keyword: `%${keyword}%`,
			});
		}

		queryBuilder
			.orderBy("post.id", "ASC")
			.limit(perPage)
			.offset(index * perPage);

		const [posts, total] = await Promise.all([
			queryBuilder.getRawMany(),
			queryBuilder.getCount(),
		]);

		return {
			total,
			postHeaders: posts.map(post => {
				return {
					id: post.post_id,
					title: post.post_title,
					author: post.author,
					createdAt: post.created_at,
					isDelete: post.is_delete,
					isPrivate: post.is_private,
				};
			}),
		};
	}
}
