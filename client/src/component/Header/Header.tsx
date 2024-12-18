import React, { useEffect } from "react";
import { FaComments } from "react-icons/fa";
import { FiLogIn, FiLogOut, FiUserPlus } from "react-icons/fi";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../../state/store";
import { useChatRoom } from "../../state/ChatRoomStore";
import useThemeStore from "../../state/ThemeStore";
import { sendPostLogoutRequest } from "../../api/users/crud";
import useCategory from "../../hook/useCategory";
import UserDropdown from "./UserDropdown";

const Header: React.FC = () => {
	const navigate = useNavigate();

	const isLogin = useUserStore.use.isLogin();
	const nickname = useUserStore.use.nickname();
	const imgUrl = useUserStore.use.imgUrl();
	const socket = useUserStore.use.socket();
	const { setLogoutUser } = useUserStore.use.actions();

	const { initializeChatState } = useChatRoom();
	const { isDarkMode, toggleDarkMode } = useThemeStore();

	const { headerCategories } = useCategory();

	useEffect(() => {
		if (isDarkMode) {
			document.body.classList.add("dark");
		} else {
			document.body.classList.remove("dark");
		}
	}, [isDarkMode]);

	const handleLogin = () => {
		const currentPath = window.location.pathname;
		navigate(`/login?redirect=${currentPath}`);
	};

	const handleLogout = async () => {
		sendPostLogoutRequest().then(res => {
			if (res.error !== "") {
				console.log(res.error);
			}

			if (socket) {
				socket.disconnect();
			}

			setLogoutUser();
			initializeChatState();
			navigate("");
		});
	};

	const handleJoin = () => {
		navigate("/join");
	};

	return (
		<div>
			<div className="dark:bg-customGray sticky top-16 z-20 flex h-16 items-center bg-blue-900 py-5 text-sm sm:top-0">
				<nav className="mx-auto flex w-full max-w-7xl gap-x-10 px-4 lg:px-0">
					<div className="ml-2 flex items-center">
						<Link
							to="/"
							className="flex items-center gap-2"
						>
							<FaComments className="text-xl text-white" />
							<span className="text-2xl font-bold text-white">
								CODEPLAY
							</span>
						</Link>
					</div>

					<div className="flex-1 justify-between sm:flex">
						<div className="hidden overflow-hidden whitespace-nowrap text-white hover:text-gray-300 sm:flex sm:items-center sm:gap-x-4 xl:gap-x-6">
							{headerCategories.map(category => (
								<Link
									key={category.id}
									to={category.path}
									className="text-white hover:text-gray-300"
								>
									{category.name}
								</Link>
							))}
						</div>
					</div>

					<div className="shrink-0 items-center justify-end gap-x-2 sm:flex lg:w-[180px] lg:gap-x-4">
						<div className="right-0 mr-4 hidden shrink-0 items-center gap-x-3 sm:flex">
							<div
								className="dark:bg-customDarkGray flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white"
								onClick={toggleDarkMode}
							>
								{isDarkMode ? (
									<MdDarkMode className="text-white" />
								) : (
									<MdLightMode className="text-blue-900" />
								)}
							</div>

							{isLogin && (
								<>
									<div className="flex flex-row gap-1.5">
										<img
											src={imgUrl}
											className="h-10 w-10 rounded-full object-cover"
										/>
										<div className="flex items-center justify-center text-white">
											{nickname}님 환영합니다.
										</div>
									</div>

									<div
										className="text-lg text-white"
										onClick={handleLogout}
									>
										<FiLogOut
											size="30"
											title="로그아웃"
										/>
									</div>

									<div className="text-lg text-white">
										<UserDropdown />
									</div>
								</>
							)}

							{!isLogin && (
								<>
									<div
										className="text-lg text-white"
										onClick={handleLogin}
									>
										<FiLogIn
											size="30"
											title="로그인"
										/>
									</div>

									<div
										className="text-lg text-white"
										onClick={handleJoin}
									>
										<FiUserPlus
											size="30"
											title="회원가입"
										/>
									</div>
								</>
							)}
						</div>
					</div>
				</nav>
			</div>
		</div>
	);
};

export default Header;
