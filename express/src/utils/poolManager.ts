import config from '../../database.json';
import sql from 'mssql';
const pools = new Map();

interface ConnectConfigProps {
	name: string;
	role: 'api_reader' | 'api_writer';
}

export function connectToMssql({ name, role }: ConnectConfigProps): Promise<sql.ConnectionPool> {
	/**
	 * Get or create a pool. If a pool doesn't exist the config must be provided.
	 * If the pool does exist the config is ignored (even if it was different to the one provided
	 * when creating the pool)
	 *
	 * @param {string} name
	 * @param {{}} [role]
	 * @return {Promise<sql.ConnectionPool>}
	 */
	if (!pools.has(name)) {
		if (!role) {
			throw new Error('Pool does not exist');
		}
		const pool = new sql.ConnectionPool(config[role]);
		// automatically remove the pool from the cache if `pool.close()` is called
		const close = pool.close.bind(pool);
		pool.close = (/*arg*/) => {
			pools.delete(name);
			return close(/*arg*/);
		};
		pools.set(name, pool.connect());
	}
	return pools.get(name);
}

export function CloseAll(): Promise<sql.ConnectionPool[]> {
	/**
	 * Closes all the pools and removes them from the store
	 *
	 * @return {Promise<sql.ConnectionPool[]>}
	 */
	return Promise.all(
		Array.from(pools.values()).map((connect) => {
			return connect.then((pool: sql.ConnectionPool) => pool.close());
		})
	);
}
