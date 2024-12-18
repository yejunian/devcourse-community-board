import { Test, TestingModule } from "@nestjs/testing";
import { PostService } from "./post.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { DataSource } from "typeorm";
import { UpdatePostDto } from "./dto/update-post.dto";
import { User } from "../user/entities/user.entity";
import { ServerError } from "../../common/exceptions/server-error.exception";
import { PostRepository } from "./post.repository";
import { LogRepository } from "../log/log.repository";
import { POST_ERROR_MESSAGES } from "./constant/post.constants";

describe("PostService", () => {
	let postService: PostService;
	let postRepository: PostRepository;
	let logRepository: LogRepository;
	let dataSource: DataSource;

	let mockUserId: number;
	let mockUser: Partial<User>;
	let mockPostId: number;
	let mockCategoryId: number;

	const mockPostRepository = {
		getPostHeaders: jest.fn(),
		getPostTotal: jest.fn(),
		getPost: jest.fn(),
		updatePost: jest.fn(),
		delete: jest.fn(),
		save: jest.fn(),
		update: jest.fn(),
		findOne: jest.fn(),
	};
	const mockDataSource = {
		createQueryRunner: jest.fn(),
	};
	const mockLogRepository = {
		save: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PostService,
				{
					provide: PostRepository,
					useValue: mockPostRepository,
				},
				{
					provide: LogRepository,
					useValue: mockLogRepository,
				},
				{
					provide: DataSource,
					useValue: mockDataSource,
				},
			],
		}).compile();

		postService = module.get<PostService>(PostService);
		postRepository = module.get<PostRepository>(PostRepository);
		logRepository = module.get<LogRepository>(LogRepository);
		dataSource = module.get<DataSource>(DataSource);

		mockUser = {
			id: 1,
			nickname: "Author",
		};
		mockUserId = mockUser.id;
		mockPostId = 2;
		mockCategoryId = 1;
	});

	describe("createPost", () => {
		const mockQueryRunner = {
			connect: jest.fn(),
			startTransaction: jest.fn(),
			commitTransaction: jest.fn(),
			rollbackTransaction: jest.fn(),
			release: jest.fn(),
			manager: {
				save: jest.fn(),
				getRepository: jest.fn().mockReturnValue({
					save: jest.fn(),
				}),
			},
		};
		mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

		const mockCreatePostDto: CreatePostDto = {
			title: "title",
			content: "content",
			category_id: mockCategoryId,
			doFilter: false,
			authorId: mockUserId,
		};

		it("게시물 생성 성공 시 postId를 반환한다.", async () => {
			mockQueryRunner.manager.save.mockResolvedValue({
				id: mockPostId,
			});

			const result = await postService.createPost(mockCreatePostDto);

			expect(mockQueryRunner.connect).toHaveBeenCalled();
			expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
			expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
			expect(mockQueryRunner.release).toHaveBeenCalled();

			expect(result).toBe(mockPostId);
		});

		it("게시물 생성 중 오류 발생 시 롤백된다.", async () => {
			const mockError = new Error("트랜잭션 중 에러 발생");
			jest.spyOn(mockQueryRunner.manager, "save").mockResolvedValue({
				id: mockPostId,
			});
			mockQueryRunner.manager
				.getRepository()
				.save.mockRejectedValue(mockError);

			await expect(
				postService.createPost(mockCreatePostDto)
			).rejects.toThrow(mockError);

			expect(mockQueryRunner.connect).toHaveBeenCalled();
			expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
			expect(mockQueryRunner.release).toHaveBeenCalled();
		});
	});

	describe("findPostHeaders", () => {
		const mockReadPostsQueryDto = {};
		it("게시물 전체 조회 성공 시 게시물들을 반환한다.", async () => {
			mockPostRepository.getPostHeaders.mockResolvedValue({});
			const result = await postService.findPostHeaders(
				mockReadPostsQueryDto,
				mockUserId
			);

			expect(mockPostRepository.getPostHeaders).toHaveBeenCalledWith(
				mockReadPostsQueryDto,
				mockUserId
			);
			expect(result).toEqual({});
		});
		it("게시물 헤더 조회 시 에러가 발생하면 에러를 반환한다.", async () => {
			const mockError = new Error("게시물 헤더 조회 중 오류 발생");

			mockPostRepository.getPostHeaders.mockRejectedValue(mockError);

			await expect(
				postService.findPostHeaders(mockReadPostsQueryDto, mockUserId)
			).rejects.toThrow(mockError);
		});
	});

	describe("findPostTotal", () => {
		const mockReadPostsQueryDto = {};
		it("게시물 개수 조회 성공 시 개수를 반환한다.", async () => {
			const mockTotal = 10;
			mockPostRepository.getPostTotal.mockResolvedValue(mockTotal);

			const result = await postService.findPostTotal(
				mockReadPostsQueryDto,
				mockUserId
			);

			expect(mockPostRepository.getPostHeaders).toHaveBeenCalledWith(
				mockReadPostsQueryDto,
				mockUserId
			);
			expect(result).toEqual(mockTotal);
		});

		it("게시물 개수 조회 도중 에러 발생 시 에러를 반환한다.", async () => {
			const mockError = new Error("게시물 개수 조회 중 오류 발생");
			mockPostRepository.getPostTotal.mockRejectedValue(mockError);

			await expect(
				postService.findPostTotal(mockReadPostsQueryDto, mockUserId)
			).rejects.toThrow(mockError);
		});
	});

	describe("findPost", () => {
		it("게시물 상세 조회 성공 시 게시물을 반환한다.", async () => {
			const mockPost = { id: 1, title: "title", content: "content" };
			mockPostRepository.getPost.mockResolvedValue(mockPost);
			const result = await postService.findPost(mockPostId, mockUserId);

			expect(mockPostRepository.getPost).toHaveBeenCalledWith(
				mockPostId,
				mockUserId
			);
			expect(result).toEqual(mockPost);
		});
		it("게시물 상세 조회 중 에러 발생 시 에러를 반환한다", async () => {
			const mockError = new Error("게시물 상세 조회 중 오류 발생");
			mockPostRepository.getPost.mockRejectedValue(mockError);

			await expect(
				postService.findPost(mockPostId, mockUserId)
			).rejects.toThrow(mockError);
		});
	});

	describe("updatePost", () => {
		let mockUpdateDto: UpdatePostDto;
		beforeEach(() => {
			jest.clearAllMocks();
			mockUpdateDto = {
				title: "New Title",
				content: "New Content",
				authorId: mockUser.id,
				doFilter: true,
			};
		});
		it("게시물 업데이트 성공", async () => {
			mockPostRepository.update.mockResolvedValue({
				affected: 1,
			});

			const result = await postService.updatePost(
				mockPostId,
				mockUpdateDto
			);

			expect(postRepository.update).toHaveBeenCalledWith(
				{ id: mockPostId, author: { id: mockUserId } },
				{ title: "New Title", content: "New Content" }
			);
			expect(result).toEqual(true);
		});

		it("존재하지 않는 post 시 에러를 반환한다", async () => {
			mockPostRepository.update.mockResolvedValue({
				affected: 0,
			});

			await expect(
				postService.updatePost(mockPostId, mockUpdateDto)
			).rejects.toThrow(
				ServerError.reference(POST_ERROR_MESSAGES.UPDATE_POST_ERROR)
			);
		});
	});
	describe("deletePost", () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});
		it("게시물 삭제 성공", async () => {
			mockPostRepository.update.mockResolvedValue({
				affected: 1,
			});

			const result = await postService.deletePost({
				authorId: mockUserId,
				postId: mockPostId,
			});

			expect(postRepository.update).toHaveBeenCalledWith(
				{ id: mockPostId, isDelete: false, author: { id: mockUserId } },
				{ isDelete: true }
			);
			expect(result).toEqual(true);
		});
		it("이미 삭제된 게시물일 시 에러를 반환한다", async () => {
			const mockDeletedPost = {
				id: mockPostId,
				isDelete: 1,
				author: { id: mockUserId },
			};

			mockPostRepository.update.mockResolvedValue({
				affected: 0,
			});

			await expect(
				postService.deletePost({
					authorId: mockUserId,
					postId: mockPostId,
				})
			).rejects.toThrow(
				ServerError.reference(POST_ERROR_MESSAGES.DELETE_POST_ERROR)
			);
		});
	});
});
