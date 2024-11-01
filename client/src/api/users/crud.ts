import {
	EmptyRequest,
	ICheckPasswordRequest,
	ICheckUserRequest,
	ICheckUserResponse,
	IGetUserMySelfResponse,
	IJoinRequest,
	ILoginRequest,
	ILoginResponse,
	IUpdatePasswordRequest,
	IUpdateProfileRequest,
	SuccessResponse,
} from "shared";
import { HttpMethod, convertToBody, httpRequest, sendRequest } from "../api";

export const sendPutUpdateUserRequest = async (body: object) => {
	return await httpRequest("user", HttpMethod.PUT, convertToBody(body));
};

export const sendPatchProfileRequest = async (body: IUpdateProfileRequest) => {
	return await httpRequest(
		"user/profile",
		HttpMethod.PATCH,
		convertToBody(body)
	);
};

export const sendPatchPasswordRequest = async (
	body: IUpdatePasswordRequest
) => {
	return await httpRequest(
		"user/password",
		HttpMethod.PATCH,
		convertToBody(body)
	);
};

export const sendDeleteUserRequest = async () => {
	return await httpRequest("user", HttpMethod.DELETE);
};

// refactoring

export const sendGetUserMyself = sendRequest<
	EmptyRequest,
	IGetUserMySelfResponse
>("user", HttpMethod.GET);

export const sendPostJoinRequest = sendRequest<IJoinRequest, SuccessResponse>(
	"user/Join",
	HttpMethod.POST
);

export const sendPostLoginRequest = sendRequest<ILoginRequest, ILoginResponse>(
	"user/login",
	HttpMethod.POST
);

export const sendPostLogoutRequest = sendRequest<EmptyRequest, SuccessResponse>(
	"user/logout",
	HttpMethod.POST
);

export const sendPostCheckPasswordRequest = sendRequest<
	ICheckPasswordRequest,
	SuccessResponse
>("user/check-password", HttpMethod.POST);

export const sendPostCheckUserRequest = sendRequest<
	ICheckUserRequest,
	ICheckUserResponse
>("user/check-duplicate", HttpMethod.POST);
