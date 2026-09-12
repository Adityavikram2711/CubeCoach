import { Router } from "express";
import { deleteSolve, listSolves, postSolve } from "../controllers/solve.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const solveRouter = Router();

solveRouter.use(requireAuth);

solveRouter.post("/", asyncHandler(postSolve));
solveRouter.get("/", asyncHandler(listSolves));
solveRouter.delete("/:id", asyncHandler(deleteSolve));
