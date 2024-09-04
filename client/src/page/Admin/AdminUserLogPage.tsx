import Pagination from '../../component/common/Pagination/Pagination';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
	LogContainer,
	LogListStyle,
	StatsCount,
	StatsIcon,
	UserStats,
	PaginationContainer,
	LogStyle,
	Title,
	LogListDetail
} from '../../component/Admin/UserLog/UserLog.css';
import { FaBookOpen } from "react-icons/fa";
import { IoChatbubbleEllipsesSharp } from "react-icons/io5";
import { HiCursorClick } from "react-icons/hi";
import { dateToStr } from '../../utils/date-to-str';
import { useFetchUserData } from '../../component/Admin/UserLog/UserLog';


export const AdminUserLogPage = () => {
	const { userId } = useParams<{ userId: string }>();
	const userIdNum = userId ? parseInt(userId, 10) : NaN;
	const initialPage = 1;
	const itemsPerPage = 10;
	const [currentPage, setCurrentPage] = useState<number>(initialPage);
	const { logs, stats, error, nickname } = useFetchUserData(userIdNum, currentPage, itemsPerPage);

	return (
		<div>
			<div
				className={Title}
				onClick={() => {
					setCurrentPage(initialPage);
				}}
			>
				<h1>{nickname}</h1>
				<p>님의 활동 내역</p>
			</div>
			<div className={LogContainer}>
				<div className={UserStats}>
					<div
						onClick={() => {
							setCurrentPage(initialPage);
						}}
					>
						<FaBookOpen className={StatsIcon} />
						<div className={StatsCount}>게시글 수</div>
						<h2>{stats.posts}</h2>
					</div>
					<div
						onClick={() => {
							setCurrentPage(initialPage);
						}}
					>
						<IoChatbubbleEllipsesSharp className={StatsIcon} />
						<div className={StatsCount}>댓글 수</div>
						<h2>{stats.comments}</h2>
					</div>
					<div>
						<HiCursorClick className={StatsIcon} />
						<div className={StatsCount}>조회수</div>
						<h2>{stats.views}</h2>
					</div>
				</div>

				<div className={LogStyle}>
					<hr />
					<div className={LogListStyle}>
						<div>제목</div>
						<div>카테고리</div>
						<div>작성일</div>
					</div>
					<hr />
					<div>
						{error ? (
							<p>{error}</p>
						) : logs.total > 0 ? (
							logs.logs.map(log => (
								<div key={logs.total}>
									<div className={LogListDetail}>
										<div>{log.title}</div>
										<div>{log.category}</div>
										<div>
											{dateToStr(
												new Date(log.createdAt),
												true
											)}
										</div>
									</div>
									<hr
										style={{
											borderColor: "rgba(0, 0, 0, 0.8)",
											borderWidth: "1px",
										}}
									/>
								</div>
							))
						) : (
							<p>사용자의 활동 내역이 없습니다.</p>
						)}
					</div>
					<hr />
				</div>

				<div className={PaginationContainer}>
					<Pagination
						currentPage={currentPage}
						totalPosts={logs.total}
						perPage={itemsPerPage}
						onChange={setCurrentPage}
					/>
				</div>
			</div>
		</div>
	);
};
