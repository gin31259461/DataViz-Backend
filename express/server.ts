import express from 'express';
import { Router } from '@/routes/router';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ErrorHandler } from './src/utils/errorHandler';
import swaggerUI from 'swagger-ui-express';
import swaggerFile from './src/swagger/swagger_output.json';
const server = express();

server.use('/api-doc', swaggerUI.serve, swaggerUI.setup(swaggerFile));
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(cors());
server.use(express.static(path.join(__dirname, 'public')));
server.use('/', Router);
server.use((err: ErrorHandler, req: express.Request, res: express.Response, next: express.NextFunction) => {
	if (res.headersSent) {
		next(err);
	}
	res.status(err.code || 500);
	res.json(
		req.app.get('env') === 'development'
			? {
					code: err.code || 500,
					message: err.message || 'An Error Occurred',
					stack: err.stack || {},
			  }
			: {}
	);
});

const port = process.env.PORT || 3080;
server.listen(port, () => {
	console.log(`> API Ready on http://localhost:${port}`);
});
