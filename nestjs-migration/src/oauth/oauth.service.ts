import { Injectable } from "@nestjs/common";
import { TOAuthProvider } from "shared";
import { Transactional } from "typeorm-transactional";
import { AuthService } from "../auth/auth.service";
import { RefreshTokensRepository } from "../auth/refresh-tokens.repository";
import { ServerError } from "../common/exceptions/server-error.exception";
import { User } from "../user/entities/user.entity";
import { UserRepository } from "../user/user.repository";
import { buildOAuthState, generateNickname } from "../utils/oauth.util";
import { OAuthPropsConfig } from "./config/oauth-props.config";
import { OAuthLoginDto } from "./dto/oauth-login.dto";
import { TOAuthLoginType } from "./interfaces/oauth.interface";
import { OAuthTokenService } from "./oauthtoken.service";
import { OAuthConnectionRepository } from "./repositories/oauth-connection.repository";
import { OAuthProviderRepository } from "./repositories/oauth-provider.repository";

@Injectable()
export class OAuthService {
	constructor(
		private oAuthPropsConfig: OAuthPropsConfig,
		private authService: AuthService,
		private userRepository: UserRepository,
		private oAuthProviderRepository: OAuthProviderRepository,
		private oAuthConnectionRepository: OAuthConnectionRepository,
		private refreshTokenRepository: RefreshTokensRepository,
		private oAuthTokenService: OAuthTokenService
	) {}

	private get oAuthProps() {
		return this.oAuthPropsConfig.getOAuthProps();
	}

	getOAuthUrl(loginType: TOAuthLoginType, provider: TOAuthProvider) {
		const { [loginType]: url } = this.buildLoginUrl(provider);

		return url;
	}

	async oAuthLogin(oAuthLoginDto: OAuthLoginDto) {
		const provider = oAuthLoginDto.provider;
		const authorizationCode = oAuthLoginDto.code;

		const { oAuthAccountId, oAuthRefreshToken } =
			await this.oAuthTokenService.verifyAuthorizationCode(
				provider,
				authorizationCode
			);

		let user = await this.userRepository.readUserByOAuth(
			provider,
			oAuthAccountId
		);

		if (user?.isDelete) {
			throw ServerError.badRequest("탈퇴한 회원입니다.");
		}

		return await this.processOAuthLogin(
			user,
			provider,
			oAuthAccountId,
			oAuthRefreshToken
		);
	}

	async oAuthReconfirm(oAuthLoginDto: OAuthLoginDto, userId: number) {
		const provider = oAuthLoginDto.provider;
		const authorizationCode = oAuthLoginDto.code;

		const { oAuthAccountId, oAuthRefreshToken } =
			await this.oAuthTokenService.verifyAuthorizationCode(
				provider,
				authorizationCode
			);

		let user = await this.userRepository.readUserByOAuth(
			provider,
			oAuthAccountId
		);

		if (!user || user.id !== userId) {
			throw ServerError.unauthorized(
				"로그인한 유저와 연동하지 않은 소셜 계정입니다."
			);
		} else if (!user.id || !user.nickname) {
			throw ServerError.reference("사용자 정보 오류");
		} else if (user.email) {
			throw ServerError.badRequest(
				"이메일, 비밀번호를 등록한 계정은 비밀번호 재확인으로 인증해야 합니다."
			);
		}

		if (oAuthRefreshToken) {
			await this.updateOauthRefreshToken(
				provider,
				oAuthAccountId,
				oAuthRefreshToken
			);
		}

		const tempToken = this.authService.makeTempToken(user.id);

		return { tempToken };
	}

	@Transactional()
	private async processOAuthLogin(
		user: User,
		provider: TOAuthProvider,
		oAuthAccountId: string,
		oAuthRefreshToken: string
	) {
		if (user && oAuthRefreshToken) {
			await this.updateOauthRefreshToken(
				provider,
				oAuthAccountId,
				oAuthRefreshToken
			);
		} else if (!user) {
			user = await this.createNewOAuthUser(
				provider,
				oAuthAccountId,
				oAuthRefreshToken
			);
		}

		if (!user.id || !user.nickname) {
			throw ServerError.reference("사용자 정보 오류");
		}

		const { accessToken, refreshToken } = this.authService.generateTokens({
			userId: user.id,
			roleId: user.roleId,
		});

		await this.refreshTokenRepository.save({
			userId: user.id,
			token: refreshToken,
			expiredAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		});

		return {
			nickname: user.nickname,
			accessToken,
			refreshToken,
		};
	}

	private async createNewOAuthUser(
		provider: TOAuthProvider,
		oAuthAccountId: string,
		oAuthRefreshToken: string
	) {
		try {
			const nickname = generateNickname();

			const user = await this.userRepository.save({ nickname });
			if (!user) {
				throw ServerError.etcError(
					500,
					"소셜 로그인으로 회원가입 실패"
				);
			}

			const newUserId = user.id;

			await this.createOAuthConnection(
				provider,
				newUserId,
				oAuthAccountId,
				oAuthRefreshToken
			);

			return user;
		} catch (error) {
			if (error.code === "ER_DUP_ENTRY") {
				throw ServerError.reference("이미 사용 중인 닉네임입니다.");
			}

			throw error;
		}
	}

	private async updateOauthRefreshToken(
		provider: string,
		oAuthAccountId: string,
		oAuthRefreshToken: string
	) {
		try {
			const oAuthConnection =
				await this.oAuthConnectionRepository.getOAuthConnectionByProviderAndAccountId(
					provider,
					oAuthAccountId
				);

			if (!oAuthConnection) {
				throw ServerError.badRequest("연동된 소셜 계정이 없습니다.");
			}

			const result = await this.oAuthConnectionRepository.update(
				oAuthConnection.id,
				{
					oAuthRefreshToken,
				}
			);

			if (result.affected === 0) {
				throw ServerError.badRequest("OAuth Refresh token 저장 실패");
			}

			return result;
		} catch (error) {
			if (error.code === "ER_DUP_ENTRY") {
				throw ServerError.badRequest("이미 연동된 소셜 계정입니다.");
			}

			throw error;
		}
	}

	private async createOAuthConnection(
		provider: TOAuthProvider,
		userId: number,
		oAuthAccountId: string,
		oAuthRefreshToken: string
	) {
		try {
			let oAuthProvider = await this.oAuthProviderRepository.findOne({
				select: ["id"],
				where: { name: provider },
			});

			if (!oAuthProvider) {
				throw ServerError.etcError(
					500,
					"소셜 로그인 연동에 실패했습니다."
				);
			}

			await this.oAuthConnectionRepository.insert({
				userId,
				oAuthProviderId: oAuthProvider.id,
				oAuthAccountId,
				oAuthRefreshToken,
			});
		} catch (error) {
			if (error.code === "ER_DUP_ENTRY") {
				throw ServerError.badRequest("이미 연동된 소셜 계정입니다.");
			} else {
				throw error;
			}
		}
	}

	private buildLoginUrl(provider: TOAuthProvider): {
		[key in TOAuthLoginType]: string;
	} {
		const {
			requestEndpoint,
			clientId,
			redirectUri,
			scope,
			getAdditionalRequestOptionsFor,
			reconfirmParams,
		} = this.oAuthProps[provider];

		const loginUrl = new URL(requestEndpoint.login);

		loginUrl.searchParams.set("response_type", "code");
		loginUrl.searchParams.set("client_id", clientId);
		loginUrl.searchParams.set("redirect_uri", redirectUri);
		loginUrl.searchParams.set("state", buildOAuthState("login"));

		if (scope) {
			loginUrl.searchParams.set("scope", scope);
		}

		if (getAdditionalRequestOptionsFor?.login) {
			const { searchParams = {} } =
				getAdditionalRequestOptionsFor.login();

			for (const key in searchParams) {
				loginUrl.searchParams.set(key, searchParams[key]);
			}
		}

		const reconfirmUrl = new URL(loginUrl);
		reconfirmUrl.searchParams.set("state", buildOAuthState("reconfirm"));
		for (const key in reconfirmParams) {
			reconfirmUrl.searchParams.set(key, reconfirmParams[key]);
		}

		const linkUrl = new URL(loginUrl);
		linkUrl.searchParams.set("state", buildOAuthState("link"));

		return {
			login: loginUrl.toString(),
			reconfirm: reconfirmUrl.toString(),
			link: linkUrl.toString(),
		};
	}
}
