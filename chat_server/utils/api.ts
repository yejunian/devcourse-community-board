import axios from "axios";
import dotenv from "dotenv";
import {
	IEnterRoomRequest,
	IEnterRoomResponse,
	IGetRoomMessageLogsRequest,
	IGetRoomMessageLogsResponse,
	IJoinRoomRequest,
	IJoinRoomResponse,
	IReadRoomRequest,
	IReadRoomResponse,
} from "shared";

dotenv.config({ path: "./../.env" });

const apiClient = axios.create({
	baseURL: process.env.SERVER_ADDRESS || "http://localhost:8000",
	timeout: 5000,
	headers: {
		"Content-Type": "application/json",
	},
});

export const getMyRoomsToApi = async (
	params: IReadRoomRequest,
	cookies: string
) => {
	return apiClient.get<IReadRoomResponse>(`/api/chat/rooms`, {
		params,
		headers: {
			Cookie: cookies,
		},
	});
};

export const joinRoomToApi = async (
	params: IJoinRoomRequest,
	cookies: string
) => {
	return apiClient.post<IJoinRoomResponse>(`/api/chat/join`, params, {
		headers: {
			Cookie: cookies,
		},
	});
};

export const getMyMemberId = async (
	params: IEnterRoomRequest,
	cookies: string
) => {
	return apiClient.post<IEnterRoomResponse>(`/api/chat/enter`, params, {
		headers: {
			Cookie: cookies,
		},
	});
};

export const getMessageLogsToApi = async (
	params: IGetRoomMessageLogsRequest,
	cookies: string
) => {
	return apiClient.get<IGetRoomMessageLogsResponse>(
		`/api/chat/room/${params.roomId}`,
		{
			headers: {
				Cookie: `${cookies}`,
			},
		}
	);
};
