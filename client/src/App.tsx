import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import "./root.css";
import Login from "./page/User/Login";
import PostInfoPage from "./page/Posts/PostInfoPage";
import Join from "./page/User/Join";
import Main from "./page/Main/Main";
import Header from "./component/Header/Header";
import { justifyCenter, mainContainer } from "./App.css";
import CheckPassword from "./page/User/CheckPassword";
import ProfileUpdate from "./page/User/ProfileUpdate";
import clsx from "clsx";
import { useGlobalErrorModal } from "./state/GlobalErrorModalStore";
import { useLayoutEffect } from "react";
import GlobalErrorModal from "./component/common/Modal/GlobalErrorModal";
import OAuthRedirectHandler from "./page/OAuth/OAuthRedirectHandler";
import ChatTestPage from "./page/Chat/ChatPage";
import { AdminUserMgmtPage } from "./page/Admin/AdminUserMgmtPage";
import { AdminPostMgmtPage } from "./page/Admin/AdminPostMgmtPage";
import { AdminStatsPage } from "./page/Admin/AdminStatsPage";
import NotFound from "./page/error/NotFound";
import { useUserStore } from "./state/store";
import { io } from "socket.io-client";
import { AdminUserLogPage } from "./page/Admin/AdminUserLogPage";
import ChatAside from "./component/Chats/ChatAside/ChatAside";
import { useChatAside } from "./state/ChatAsideStore";
import OAuthLink from "./page/OAuth/OAuthLink";
import EmailRegistration from "./page/User/EmailRegistration";
import ChatBtn from "./component/Chats/ChatBtn/ChatBtn";
import Community from "./page/Category/Community";
import { AdminPage } from "./page/Admin/AdminPage";
import UpsertPostPage from "./page/Posts/UpsertPostPage";
import ProfilePage from "./page/Profile/ProfilePage";
import { Rank } from "./page/Rank/Rank";
import useCategory from "./hook/useCategory";
import Toast from "./component/common/Toast/Toast";

function MainContainer({ children }: { children: React.ReactNode }) {
	const location = useLocation();

	// 중앙 정렬이 필요한 페이지들
	const centerJustifyRoutes = [
		"/login",
		"/join",
		"/checkPassword",
		"/profileUpdate",
		"/emailRegistration",
		"/oauth",
	];

	if (location.pathname === "/") {
		return <>{children}</>; // 메인 페이지에서는 children만 렌더링
	}

	return (
		<div
			className={clsx(mainContainer, {
				[justifyCenter]: centerJustifyRoutes.includes(
					location.pathname
				),
			})}
		>
			{children}
		</div>
	);
}

function App() {
	const globalErrorModal = useGlobalErrorModal();

	const isLogin = useUserStore.use.isLogin();
	const socket = useUserStore.use.socket();
	const { isOpen } = useChatAside();

	const { setSocket } = useUserStore.use.actions();

	const { categories } = useCategory();

	useLayoutEffect(() => {
		// 로그인은 되어 있으나 소켓이 없는 경우
		if (isLogin && !socket) {
			setSocket(
				io(`${import.meta.env.VITE_CHAT_ADDRESS}`, {
					withCredentials: true,
				})
			);

			return;
		}

		// 로그인이 안되있으나 소켓이 있는 경우
		if (!isLogin && socket) {
			socket.disconnect();
			setSocket(null);
			return;
		}
	}, []);

	return (
		<div className="min-h-full">
			<BrowserRouter>
				<Header />

				<MainContainer>
					<Toast />

					<GlobalErrorModal
						isOpen={globalErrorModal.isOpen}
						variant={globalErrorModal.variant}
						callback={globalErrorModal.callback}
						onClose={globalErrorModal.close}
					>
						{globalErrorModal.title && (
							<GlobalErrorModal.Title>
								{globalErrorModal.title}
							</GlobalErrorModal.Title>
						)}

						<GlobalErrorModal.Body>
							{globalErrorModal.message}
						</GlobalErrorModal.Body>
					</GlobalErrorModal>

					<Routes>
						<Route
							path="/"
							element={<Main />}
						/>
						<Route
							path="/login"
							element={<Login />}
						/>
						<Route
							path="/join"
							element={<Join />}
						/>
						<Route
							path="/oauth/redirect/:provider"
							element={<OAuthRedirectHandler />}
						/>
						<Route
							path="/checkPassword"
							element={<CheckPassword />}
						/>
						<Route
							path="/profileUpdate"
							element={<ProfileUpdate />}
						/>
						<Route
							path="/post/:id"
							element={<PostInfoPage />}
						/>
						<Route
							path="/chat"
							element={<ChatTestPage />}
						/>
						<Route
							path="/admin"
							element={<AdminPage />}
						/>
						<Route
							path="/admin/userMgmt"
							element={<AdminUserMgmtPage />}
						/>
						<Route
							path="/admin/postMgmt"
							element={<AdminPostMgmtPage />}
						/>
						<Route
							path="/admin/stats"
							element={<AdminStatsPage />}
						/>
						<Route
							path="/admin/userLog/:userId"
							element={<AdminUserLogPage />}
						/>
						<Route
							path="/oauth"
							element={<OAuthLink />}
						/>
						<Route
							path="/emailRegistration"
							element={<EmailRegistration />}
						/>
						<Route
							path="*"
							element={<NotFound />}
						/>
						{categories.map(category => (
							<Route
								key={category.id}
								path={category.path}
								element={<Community categoryId={category.id} />}
							/>
						))}
						<Route
							path="/post/new"
							element={<UpsertPostPage />}
						/>
						<Route
							path="/profile"
							element={<ProfilePage />}
						/>
						<Route
							path="/rank"
							element={<Rank />}
						/>
					</Routes>
				</MainContainer>

				{isOpen && <ChatAside />}
				<ChatBtn />
			</BrowserRouter>
		</div>
	);
}

export default App;
