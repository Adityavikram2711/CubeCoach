import { Router } from "express";
import { postSolveCube } from "../controllers/cube.controller.js";

export const cubeRouter = Router();

cubeRouter.post("/solve", postSolveCube);
