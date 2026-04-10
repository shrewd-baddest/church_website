import { Router } from "express";
import { GenerateQuestion } from "../../controllers/questionGenerator.js/GenerateQuestion.js";
import { getDailyQuestions } from "../../controllers/questionGenerator.js/FetchQuestions.js";

const route = Router();

route.post("/", GenerateQuestion);
route.get("/", getDailyQuestions);

export default route;
