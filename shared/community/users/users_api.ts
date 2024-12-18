import { DefaultResponse } from "../api";
import { ILoginUserInfo, INonSensitiveUser } from "./users";

// login
export interface ILoginRequest {
	email: string;
	password: string;
}

export interface ILoginResponse extends DefaultResponse {
	userInfo: ILoginUserInfo;
}

// getUserMySelf
export interface IGetUserMySelfResponse extends DefaultResponse {
	nonSensitiveUser: INonSensitiveUser;
}

// join
export interface IJoinRequest {
	email: string;
	nickname: string;
	password: string;
}

// update profile

export interface IUpdateProfileRequest {
	nickname?: string;
	imgUrl?: string;
}

export interface IUpdatePasswordRequest {
	originPassword: string;
	newPassword: string;
}

// check info

export interface ICheckPasswordRequest {
	password: string;
}

export interface ICheckUserRequest {
	email?: string;
	nickname?: string;
}

export interface ICheckUserResponse extends DefaultResponse {
	isDuplicated: boolean;
}

export interface IUpdateUserRequest {
	email?: string;
	nickname: string;
	password: string;
}
