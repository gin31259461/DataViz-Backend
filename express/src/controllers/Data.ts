import { Request, Response, NextFunction } from 'express';
import { ErrorHandler } from '@/utils/errorHandler';
import { connectToMssql } from '@/utils/poolManager';
import sql from 'mssql';

export async function GetData(req: Request, res: Response, next: NextFunction) {
	try {
		const pool = await connectToMssql({ name: 'api_reader', role: 'api_reader' });
		const request = pool.request();
		let sqlQuery = '',
			response: sql.IRecordSet<any>;

		request.input('oid', sql.Int, req.query.oid);
		request.input('order', sql.NVarChar, req.query.order);
		request.input('start', sql.Int, req.query.start);
		request.input('counts', sql.Int, req.query.counts);

		if (req.query.method === 'total' && req.query.oid !== undefined) {
			sqlQuery = `
				SELECT count(*) as count
				FROM vd_ShowObject O
				WHERE O.mid = @oid
				AND type = 6
			`;
		} else if (req.query.method === 'getData' && req.query.oid !== undefined) {
			sqlQuery = 'select top 10 * from RawDB.dbo.D' + req.query.oid;
			const checkTableExist =
				"select * from RawDB.INFORMATION_SCHEMA.TABLES where TABLE_NAME = 'D" +
				req.query.oid +
				"' and TABLE_TYPE = 'BASE TABLE'";
			const tableResult = await request.query(checkTableExist);
			response = tableResult.recordset;
			if (response.length == 0) sqlQuery = '';
		} else {
			sqlQuery = 'select * from vd_Data';

			if (Object.keys(req.query).filter((m) => m != 'order' && m != 'start' && m != 'counts').length > 0) {
				sqlQuery += ' where ';
				Object.keys(req.query)
					.filter((m) => m != 'order' && m != 'start' && m != 'counts')
					.map((m) => {
						sqlQuery += ' and ' + m + ' = @' + m;
					});
				sqlQuery = sqlQuery.replace(' and', ''); // 去除第一個 and
			}

			if (req.query.order != undefined) sqlQuery += ' order by ' + req.query.order;
			if (req.query.start != undefined && req.query.counts != undefined)
				sqlQuery += ' offset @start - 1 row fetch next @counts rows only';
		}

		if (sqlQuery.length == 0) {
			res.send('no results');
		} else {
			const result = await request.query(sqlQuery);
			res.status(200);
			res.send(result.recordset);
		}
	} catch (err) {
		const error = new ErrorHandler();
		next(error);
	}
}

export async function PostData(req: Request, res: Response, next: NextFunction) {
	try {
		const pool = await connectToMssql({ name: 'api_writer_post', role: 'api_writer' });
		const request = pool.request();

		request.input('mid', sql.Int, req.body.mid);
		request.input('name', sql.NVarChar(30), req.body.name);
		request.input('des', sql.NVarChar(sql.MAX), req.body.des);
		request.output('lastID', sql.NVarChar(sql.MAX));
		const result = await request.execute('dbo.usp_PostData');

		res.status(201);
		res.send(result.output);
	} catch (err) {
		const error = new ErrorHandler();
		next(error);
	}
}

export async function DeleteData(req: Request, res: Response, next: NextFunction) {
	try {
		const pool = await connectToMssql({ name: 'api_writer_delete', role: 'api_writer' });
		const request = pool.request();

		request.input('mid', sql.Int, req.query.mid);
		request.input('oid', sql.Int, req.query.oid);
		await request.execute('dbo.usp_DeleteData');

		res.status(204);
		res.send('success delete data');
	} catch (err) {
		const error = new ErrorHandler();
		next(error);
	}
}
