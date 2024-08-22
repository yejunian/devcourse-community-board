import { Request, Response, NextFunction } from "express";
import { createOAuthConnection } from "../db/context/oauth_context";
import { addRefreshToken } from "../db/context/token_context";
import { addOAuthUser, readUserByOAuth } from "../db/context/users_context";
import { getKstNow } from "../utils/getKstNow";
import { ServerError } from "../middleware/errors";
import { TOAuthProvider } from "../utils/oauth/constants";
import { buildLoginUrl, verifyAuthorizationCode } from "../utils/oauth/oauth";
import {
	makeAccessToken,
	makeRefreshToken,
	makeTempToken,
} from "../utils/token";

export const handleOAuthLoginUrlRead = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const provider = req.params.provider as TOAuthProvider;
		const { loginUrl } = buildLoginUrl(provider);

		res.status(200).json({ url: loginUrl });
	} catch (err) {
		next(err);
	}
};

export const handleOAuthLogin = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const provider = req.body.provider as TOAuthProvider;
		const authorizationCode = req.body.code as string;

		let oAuthAccountId = await verifyAuthorizationCode(
			provider,
			authorizationCode
		);
		let user = await readUserByOAuth(provider, oAuthAccountId);

		// TODO: 회원 등록부터 리프레시 토큰 등록까지의 동작에 트랜잭션 적용
		//       (회원 등록 이후 과정이 실패했을 때 변경사항 롤백 필요)

		// 유저가 존재하지 않으면 신규 회원가입 처리(랜덤 닉네임 부여)
		if (!user) {
			// TODO: 자연스러운 닉네임 생성
			const nickname =
				"신규 " +
				(0x1000000 * Math.random()).toString(16).padStart(6, "0");

			const newUserId = await addOAuthUser(nickname);
			await createOAuthConnection(provider, newUserId, oAuthAccountId);

			user = {
				nickname,
				id: newUserId,
				isDelete: false,
			};
		}

		if (!user.id || !user.nickname) {
			throw ServerError.reference("사용자 정보 오류");
		}

		// 토큰 발급
		const accessToken = makeAccessToken(user.id);
		const refreshToken = makeRefreshToken(user.id);
		await addRefreshToken(
			user.id,
			refreshToken,
			new Date(Date.now() + 1000 * 60 * 60 * 24)
		);

		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: true,
		});

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: true,
		});

		// 로그인 정보 응답
		res.status(200).json({
			message: "로그인 성공",
			result: {
				nickname: user.nickname,
				loginTime: getKstNow(),
			},
		});
	} catch (err) {
		next(err);
	}
};

export const handleOAuthReconfirmUrlRead = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const provider = req.params.provider as TOAuthProvider;
		const { reconfirmUrl } = buildLoginUrl(provider);

		res.status(200).json({ url: reconfirmUrl });
	} catch (err) {
		next(err);
	}
};

export const handleOAuthReconfirm = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const provider = req.body.provider as TOAuthProvider;
		const authorizationCode = req.body.code as string;

		let oAuthAccountId = await verifyAuthorizationCode(
			provider,
			authorizationCode
		);
		let userByOAuth = await readUserByOAuth(provider, oAuthAccountId);

		if (!userByOAuth || userByOAuth.id !== req.userId) {
			throw ServerError.unauthorized(
				"로그인한 유저와 연동하지 않은 소셜 계정입니다."
			);
		} else if (!userByOAuth.id || !userByOAuth.nickname) {
			throw ServerError.reference("사용자 정보 오류");
		} else if (userByOAuth.email) {
			throw ServerError.badRequest(
				"이메일, 비밀번호를 등록한 계정은 비밀번호 재확인으로 인증해야 합니다."
			);
		}

		const tempToken = makeTempToken(userByOAuth.id);
		res.cookie("tempToken", tempToken, { maxAge: 1000 * 60 * 60 }); // 유효기간 1시간

		res.status(200).json({ message: "소셜 계정 확인 성공" });
	} catch (err) {
		next(err);
	}
};