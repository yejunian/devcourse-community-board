import { ServerError } from "../../middleware/errors";
import {
	FieldPacket,
	PoolConnection,
	ResultSetHeader,
	RowDataPacket,
} from "mysql2/promise";
import pool from "../connect";
import {
	ICreateRoomRequest,
	IReadRoomRequest,
	IReadRoomResponse,
	mapDBToIMessage,
	mapDBToIMessages,
	mapDBToIRoomHeader,
	mapDBToIRoomHeaders,
} from "shared";

export const addRoom = async (userId: number, body: ICreateRoomRequest) => {
	let conn: PoolConnection | null = null;

	try {
		let sql = `INSERT INTO rooms ( name, is_private, password ) VALUES (?, ?, ?)`;
		let values = [body.title, body.isPrivate, body.password];
		conn = await pool.getConnection();
		conn.beginTransaction();

		const [insertRoomResults]: any[] = await conn.query(sql, values);

		if (insertRoomResults.affectedRows === 0) {
			conn.rollback();
			throw ServerError.reference("채팅방 생성 실패");
		}

		const roomId = insertRoomResults.insertId;

		sql = `INSERT INTO members ( id, room_id, is_host ) VALUES (?, ?, ?)`;
		values = [userId, roomId, true];

		const [insertMembersResults]: any[] = await conn.query(sql, values);

		if (insertMembersResults.affectedRows === 0) {
			conn.rollback();
			throw ServerError.reference("채팅방 생성 실패");
		}

		conn.commit();

		return roomId;
	} catch (err) {
		throw err;
	} finally {
		if (conn) conn.release();
	}
};

export const getRoomsByKeyword = async (body: IReadRoomRequest) => {
	let conn: PoolConnection | null = null;

	try {
		const keyword = `%${body.keyword.trim()}%`;

		let countSql = `
				SELECT
					COUNT(*) as total
				FROM
					rooms
				WHERE
					name LIKE ?
		`;
		const values: (string | number)[] = [keyword];

		conn = await pool.getConnection();
		const [countRows]: any[] = await conn.query(countSql, values);
		const totalRoomCount = countRows[0].total;

		let dataSql = `
				SELECT 
    				r.id,
					r.name,
					r.is_private,
					COUNT(m.id) AS membersCount
				FROM
					rooms as r
					LEFT JOIN members as m
					ON r.id = m.room_id
				WHERE
					name LIKE ?
				GROUP BY
        			r.id, r.name, r.is_private
				LIMIT ? OFFSET ?;
					`;

		values.push(body.perPage);
		values.push(body.page * body.perPage);

		const [dataRows]: any[] = await conn.query(dataSql, values);

		const roomHeaders = mapDBToIRoomHeaders(dataRows);

		return {
			totalRoomCount,
			roomHeaders,
		};
	} catch (err) {
		throw err;
	} finally {
		if (conn) conn.release();
	}
};

export const getRoomsByUserId = async (
	userId: number,
	page: number,
	perPage: number
) => {
	let conn: PoolConnection | null = null;
	try {
		let countSql = `
				SELECT
					COUNT(r.id) as total
				FROM
					members AS m
					LEFT JOIN
					rooms AS r
					ON m.room_id = r.id
				WHERE
					m.id = ?
		`;
		const values = [userId];

		conn = await pool.getConnection();
		const [countRows]: any[] = await conn.query(countSql, values);
		const totalRoomCount = countRows[0].total;

		let dataSql = `
				SELECT
					r.id,
                    r.name,
                    r.is_private,
                    COUNT(m.id) AS membersCount
				FROM
					members AS m
					LEFT JOIN
					rooms AS r
					ON m.room_id = r.id
				WHERE
					m.id = ?
				GROUP BY
        			r.id, r.name, r.is_private
				LIMIT ? OFFSET ?;
		`;

		values.push(perPage);
		values.push(page * perPage);

		const [dataRows]: any[] = await conn.query(dataSql, values);
		console.log(dataRows);
		const roomHeaders = mapDBToIRoomHeaders(dataRows);

		return {
			totalRoomCount,
			roomHeaders,
		};
	} catch (err) {
		throw err;
	} finally {
		if (conn) conn.release();
	}
};

export const getMessageLogs = async (userId: number, roomId: number) => {
	let conn: PoolConnection | null = null;
	try {
		conn = await pool.getConnection();

		// roomId가 일치하는 meesages table의 모든 데이터 가져와 주기
		// sort by create_at ASC
		// isMine -> messages.user_id === userId
		let sql = `
			SELECT
			    m.room_id,
				u.nickname,
				m.content,
				m.created_at,
                m.user_id,
				m.is_system
			FROM
				messages as m
			LEFT JOIN
				users as u
			ON m.user_id = u.id
			WHERE
				m.room_id = ?
		`;
		const values = [roomId];
		const [rows]: any[] = await conn.query(sql, values);

		return mapDBToIMessages(userId, rows);
	} catch (err) {
		throw err;
	} finally {
		if (conn) conn.release();
	}
};
