export interface IMessage {
	id?: number; // 채팅 번호
	memberId: number; // 입장자 번호
	roomId: number; // 방 번호
	nickname?: string; // 보낸 사람 이름
	message: string; // 채팅 내용
	createdAt: Date; // 생성 시간
	isSystem: boolean; // true : 시스템 메세지
	isDeleted?: boolean; // true : 사용자 탈퇴
	isMine?: boolean; // true : 내 메세지
}

export interface IRoomHeader {
	roomId: number; // 방 번호
	title: string; // 채팅방 이름
	totalMembersCount: number; // 채팅방 멤버 수
	isPrivate: boolean; // true : 비밀방
	liveRoomInfo: ILiveRoomInfo; // 소켓을 통해 실시간으로 바뀌는 정보
}

export interface ILiveRoomInfo {
	lastMessage: IMessage; // 채팅방의 마지막 메세지
	curNum: number; // 현재 접속한 사용자 수
	newMessages: number; // 새로운 채팅 수
}

export interface IRoomMember {
	roomId: number;
	memberId: number;
}

export interface ISocketMessageDTO {
	memberId: number; // 입장자 번호
	roomId: number; // 방 번호
	nickname: string; // 보낸 사람 이름
	message: string; // 채팅 내용
	createdAt: string; // 생성 시간
	isSystem: boolean; // true : 시스템 메세지
	isMine?: boolean; // true : 내 메세지
}

export interface IKafkaMessageDTO {
	memberId: number; // 입장자 번호
	message: string; // 채팅 내용
	createdAt: Date; // 생성 시간
	isSystem: boolean; // 시스템 메시지 유무
}
