import { Request, Response, NextFunction } from "express";
import { deleteUser, getUsersInfo } from "../db/context/users_context";
import { mapUsersInfoToResponse } from "../db/mapper/users_mapper";
import { ServerError } from "../middleware/errors";

export const handleGetUsers = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		let index = parseInt(req.query.index as string) - 1 || 0;
		let perPage = parseInt(req.query.perPage as string) || 10;
		if (index < 0 || perPage < 0) {
			index = 0;
			perPage = 10;
		}

		let nickname = req.query.nickname as string;
		let email = req.query.email as string;
		const result = await getUsersInfo({ index, perPage, nickname, email });
		res.status(200).json(mapUsersInfoToResponse(result));
	} catch (err: any) {
		next(err);
	}
};

export const handleAdminDeleteUser = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		if (!req.params.userId) {
			throw ServerError.badRequest("userId가 존재하지 않습니다.");
		}

		const userId = parseInt(req.params.userId);

		if (isNaN(userId)) {
			throw ServerError.badRequest("userId가 숫자가 아닙니다.");
		}
		await deleteUser(userId);
		res.status(200).json({ message: "회원 삭제 성공" });
	} catch (err: any) {
		next(err);
	}
};
