import {
	FC,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { IMessage, IRoomMember } from "shared";

import { chatRoomBody, chatRoomContainer } from "./ChatRoom.css";
import ChatInput from "./ChatInput";
import ChatRoomHeader from "./ChatRoomHeader";
import MyChat from "./MyChat";
import SystemChat from "./SystemChat";
import YourChat from "./YourChat";
import { useUserStore } from "../../../state/store";
import { ChatRoomSideBar } from "./SideBar/ChatRoomSideBar";
import { ApiCall } from "../../../api/api";
import { sendGetRoomMembersRequest } from "../../../api/chats/crud";

interface Props {
	title: string;
	roomId: number;
	setSelectedRoom: (room: { title: string; roomId: number } | null) => void;
}

// TODO : props로 roomId, title 받을 것
const ChatRoom: FC<Props> = ({ title, roomId, setSelectedRoom }) => {
	// 전역 상태
	const nickname = useUserStore.use.nickname();
	const socket = useUserStore.use.socket();
	// TODO : zustand에서 해당 채팅방에 대한 메시지 꺼내오기

	// 컴포넌트 상태
	const [message, setMessage] = useState("");
	// TODO : messageLogs zustand에 저장할 것
	const [messageLogs, setMessageLogs] = useState<IMessage[]>([]); // TEST : 컴포넌트 상태 저장
	const [roomLoading, setRoomLoading] = useState(true);
	const [chatLoading, setChatLoading] = useState(false);
	const [myMemberId, setMyMemberId] = useState<number>(0);

	const [roomMembers, setRoomMembers] = useState<IRoomMember[]>([
		{ memberId: 1, nickname: "123", isHost: true },
		{ memberId: 1, nickname: "123", isHost: false },
	]);

	// chatroom aside
	const [isSideBarOpen, setIsSideBarOpen] = useState<boolean>(false);

	const messageMap: Map<string, IMessage[]> = useMemo(() => {
		const map = new Map<string, IMessage[]>();

		messageLogs.forEach(message => {
			const date: string = message.createdAt.toISOString().split("T")[0];
			if (!map.get(date)) {
				const [year, month, day] = date.split("-");
				const dateTitle: IMessage = {
					isSystem: true,
					nickname: "System",
					message: `${year}년 ${month}월 ${day}일`,
					createdAt: new Date(date),
					isMine: false,
					memberId: 0,
					roomId: message.roomId,
				};
				map.set(date, [dateTitle]);
			}

			map.get(date)?.push(message);
		});

		return map;
	}, [messageLogs]);

	const chatRef = useRef<HTMLDivElement>(null);

	const [sortedMessages, setSortedMessages] = useState<IMessage[]>([]);

	const strToDate = (newMessage: IMessage) => {
		const msg: IMessage = newMessage;
		msg.createdAt = new Date(msg.createdAt);
		return msg;
	};

	useLayoutEffect(() => {
		getMembers();
	}, [roomId]);

	useLayoutEffect(() => {
		if (socket) {
			const handleReceiveMessage = (newMessage: IMessage) => {
				const msg: IMessage = strToDate(newMessage);
				setMessageLogs(prev => [...prev, msg]);
			};

			// 이전 메시지 모두 불러오기
			socket.emit(
				"enter_room",
				roomId,
				(response: { memberId: number; messageLogs: IMessage[] }) => {
					setMyMemberId(response.memberId);
					const msgs = response.messageLogs.map(message => {
						return strToDate(message);
					});
					setMessageLogs(msgs);
					setRoomLoading(false);
				}
			);

			// 실시간 메시지 수신 설정
			socket.on("receive_message", handleReceiveMessage);

			return () => {
				// 소켓 이벤트 핸들러 제거
				socket.off("receive_message", handleReceiveMessage);
			};
		}
	}, [roomId, socket]);

	useEffect(() => {
		const sorted = Array.from(messageMap.entries())
			.sort(
				([dateA], [dateB]) =>
					new Date(dateA).getTime() - new Date(dateB).getTime()
			)
			.reduce(
				(acc: IMessage[], [, messages]) => acc.concat(messages),
				[]
			);
		setSortedMessages(sorted);
	}, [messageMap]);

	useEffect(() => {
		if (!chatRef.current) {
			return;
		}
		chatRef.current.scrollTop = chatRef.current?.scrollHeight;
	}, [sortedMessages]);

	const backBtnClick = () => {
		setSelectedRoom(null);
	};

	const chatInputClick = () => {
		console.log("memberId:", myMemberId);

		if (!message.length || chatLoading) {
			return;
		}

		const msg: IMessage = {
			memberId: myMemberId,
			roomId,
			nickname,
			message,
			createdAt: new Date(),
			isMine: true,
			isSystem: false,
		};

		console.log("before send :", msg);

		setChatLoading(true);

		if (socket) {
			socket.emit("send_message", msg, (isSuccess: boolean) => {
				if (isSuccess) {
					setMessageLogs(prev => [...prev, msg]);
				} else {
					console.error(msg);
					// TODO : 재전송 로직 추가
				}

				setMessage("");
				setChatLoading(false);
			});
		}
	};

	const renderMessages = () => {
		if (roomLoading) {
			// TODO : spinner 추가
			return <p>Loading...</p>;
		}

		return sortedMessages.map((message, index) => {
			if (message.isSystem) {
				return (
					<SystemChat
						key={index}
						content={message.message}
					/>
				);
			} else if (message.isMine) {
				return (
					<MyChat
						key={index}
						content={message.message}
						time={message.createdAt}
					/>
				);
			}

			return chatLoading ? (
				// TODO : spinner 추가
				<p>Loading...</p>
			) : (
				<YourChat
					key={index}
					name={message.nickname!}
					content={message.message}
					time={message.createdAt}
				/>
			);
		});
	};

	const getMembers = async () => {
		const roomMembers = await ApiCall(
			() => sendGetRoomMembersRequest(roomId),
			err => {
				console.error("사용자 정보를 가져올 수 없습니다.", err);
			}
		).then(response => {
			if (response instanceof Error) {
				return;
			}

			return response.roomMembers;
		});

		setRoomMembers(roomMembers);
	};

	return (
		<div className={chatRoomContainer}>
			{isSideBarOpen && (
				<ChatRoomSideBar
					title={title}
					sideBarClose={() => {
						setIsSideBarOpen(false);
					}}
					members={roomMembers}
					roomId={roomId}
					myMemberId={myMemberId}
					goBack={backBtnClick}
				/>
			)}
			<ChatRoomHeader
				title={title}
				onClick={backBtnClick}
				isOpen={isSideBarOpen}
				open={() => {
					setIsSideBarOpen(true);
				}}
				close={() => {
					setIsSideBarOpen(false);
				}}
			/>
			<div
				ref={chatRef}
				className={chatRoomBody}
			>
				{renderMessages()}
			</div>
			<ChatInput
				message={message}
				setMessage={setMessage}
				onClick={chatInputClick}
			/>
		</div>
	);
};

export default ChatRoom;
