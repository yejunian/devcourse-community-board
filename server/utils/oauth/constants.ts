import { TOAuthProvider } from "../../db/model/oauth";

type TOAuthVariable<T> = {
	[provider in TOAuthProvider]: T;
};

type TOAuthRequestType = "login" | "token" | "user";

interface IKeyValuePairs {
	[key: string]: string;
}

type TOAuthProps = {
	clientId: string;
	clientSecret?: string;

	scope?: string;
	redirectUri: string;

	requestEndpoint: {
		[key in TOAuthRequestType]: string;
	};

	getAdditionalRequestOptionsFor?: {
		[key in TOAuthRequestType]?: (options?: any) => {
			headers?: IKeyValuePairs;
			searchParams?: IKeyValuePairs;
			body?: IKeyValuePairs;
		};
	};

	reconfirmParams: IKeyValuePairs;
};

const getRedirectUri = (provider: TOAuthProvider) => {
	return `http://localhost:${process.env.PORT}/oauth/redirect/${provider}`;
};

export const oAuthRequestContentType =
	"application/x-www-form-urlencoded;charset=utf-8";

export const oAuthProps: TOAuthVariable<TOAuthProps> = {
	google: {
		clientId: process.env.OAUTH_GOOGLE_CLIENT_ID ?? "",
		clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET ?? "",

		scope: "https://www.googleapis.com/auth/userinfo.profile",
		redirectUri: getRedirectUri("google"),

		requestEndpoint: {
			login: "https://accounts.google.com/o/oauth2/v2/auth",
			token: "https://oauth2.googleapis.com/token",
			user: "https://www.googleapis.com/oauth2/v2/userinfo",
		},

		getAdditionalRequestOptionsFor: {
			login: () => ({
				searchParams: {
					access_type: "offline",
				},
			}),
		},

		reconfirmParams: {
			prompt: "consent",
		},
	},

	kakao: {
		clientId: process.env.OAUTH_KAKAO_CLIENT_ID ?? "",
		clientSecret: process.env.OAUTH_KAKAO_CLIENT_SECRET ?? "",

		redirectUri: getRedirectUri("kakao"),

		requestEndpoint: {
			login: "https://kauth.kakao.com/oauth/authorize",
			token: "https://kauth.kakao.com/oauth/token",
			user: "https://kapi.kakao.com/v2/user/me",
		},

		reconfirmParams: {
			prompt: "login",
		},
	},

	naver: {
		clientId: process.env.OAUTH_NAVER_CLIENT_ID ?? "",
		clientSecret: process.env.OAUTH_NAVER_CLIENT_SECRET ?? "",

		redirectUri: getRedirectUri("naver"),

		requestEndpoint: {
			login: "https://nid.naver.com/oauth2.0/authorize",
			token: "https://nid.naver.com/oauth2.0/token",
			user: "https://openapi.naver.com/v1/nid/me",
		},

		reconfirmParams: {
			auth_type: "reauthenticate",
		},
	},
};
