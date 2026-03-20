import { Router, type IRouter } from "express";
import healthRouter from "./health";
import programsRouter from "./programs/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use(programsRouter);

export default router;
