import { Middleware } from '@/controllers/Middleware';
import express from 'express';
import { DeleteData, GetData, PostData } from '@/controllers/Data';
const router = express.Router();

router.use(Middleware);
router.route('/api/GetData').get(GetData);
router.route('/api/PostData').post(PostData);
router.route('/api/DeleteData').delete(DeleteData);

export { router as Router };
