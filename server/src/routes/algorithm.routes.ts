import { Router } from "express";
import { getAlgorithmById, getAlgorithms } from "../controllers/algorithm.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const algorithmRouter = Router();

algorithmRouter.get("/", asyncHandler(getAlgorithms));
algorithmRouter.get("/:id", asyncHandler(getAlgorithmById));
