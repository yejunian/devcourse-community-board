import { IPostInfo, mapDBToPostInfo } from "shared";
import { create } from "zustand";
import { ApiCall } from "../api/api";
import { sendGetPostRequest } from "../api/posts/crud";

interface IPostInfoState {
	post: IPostInfo;
	postErrorMessage: string;
	postFetchState: "loading" | "error" | "ok";
	isQna: boolean;
}

interface IPostInfoActions {
	fetchPost: (postId: number) => void;
}

type TPostInfoStore = IPostInfoState & IPostInfoActions;

export const getEmptyPostInfo = (): IPostInfo => ({
	id: 0,
	title: "",
	content: "",
	category: "",
	author_id: 0,
	author_nickname: "",
	is_author: false,
	created_at: new Date(Date.now()),
	updated_at: undefined,
	views: 0,
	likes: 0,
	user_liked: false,
});

export const usePostInfo = create<TPostInfoStore>(set => ({
	post: getEmptyPostInfo(),
	postErrorMessage: "",
	postFetchState: "loading",
	isQna: false,

	fetchPost: async (postId: number) => {
		const res = await ApiCall(
			() => sendGetPostRequest(postId),
			err => {
				set(state => ({
					...state,
					post: getEmptyPostInfo(),
					postErrorMessage: err.message,
					postFetchState: "error",
					isQna: false,
				}));
			}
		);

		if (res instanceof Error) {
			return;
		}

		const fetchedPost = mapDBToPostInfo(res.post);

		set(state => ({
			...state,
			post: fetchedPost,
			postErrorMessage: "",
			postFetchState: "ok",
			isQna: fetchedPost.category === "QnA",
		}));
	},

	clear: () =>
		set({
			post: getEmptyPostInfo(),
			postErrorMessage: "",
			postFetchState: "loading",
			isQna: false,
		}),
}));
