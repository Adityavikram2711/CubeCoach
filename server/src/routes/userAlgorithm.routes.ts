import { Router } from "express";
import {
  deleteUserAlgorithm,
  getUserAlgorithm,
  listUserAlgorithms,
  postRecordPractice,
  postToggleFavorite,
  postToggleLearned,
  putUserAlgorithm,
} from "../controllers/userAlgorithm.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const userAlgorithmRouter = Router();

userAlgorithmRouter.use(requireAuth);

userAlgorithmRouter.get("/", asyncHandler(listUserAlgorithms));
userAlgorithmRouter.get("/:algorithmId", asyncHandler(getUserAlgorithm));
userAlgorithmRouter.put("/:algorithmId", asyncHandler(putUserAlgorithm));
userAlgorithmRouter.delete("/:algorithmId", asyncHandler(deleteUserAlgorithm));
userAlgorithmRouter.post("/:algorithmId/favorite", asyncHandler(postToggleFavorite));
userAlgorithmRouter.post("/:algorithmId/learned", asyncHandler(postToggleLearned));
userAlgorithmRouter.post("/:algorithmId/practice", asyncHandler(postRecordPractice));
