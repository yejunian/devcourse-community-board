import express from "express";
import {
	handleOAuthLoginUrlRead,
	handleOAuthLogin,
	handleOAuthReconfirmUrlRead,
	handleOAuthReconfirm,
	handleOAuthLinkUrlRead,
	handleOAuthLinkCreate,
} from "../controller/oauth_controller";
import { requireLogin } from "../middleware/auth";
import {
	getOAuthLoginUrlValidator,
	postOAuthLoginValidatior,
} from "../utils/validations/oauth/oauth";

const router = express.Router();
router.use(express.json());

router.get(
	"/login-url/:provider",
	getOAuthLoginUrlValidator(),
	handleOAuthLoginUrlRead
);
router.post("/login", postOAuthLoginValidatior(), handleOAuthLogin);

router.get(
	"/reconfirm-url/:provider",
	getOAuthLoginUrlValidator(),
	handleOAuthReconfirmUrlRead
);
router.post(
	"/reconfirm",
	requireLogin,
	postOAuthLoginValidatior(),
	handleOAuthReconfirm
);

router.get(
	"/link-url/:provider",
	getOAuthLoginUrlValidator(),
	handleOAuthLinkUrlRead
);
router.post(
	"/link",
	requireLogin,
	postOAuthLoginValidatior(),
	handleOAuthLinkCreate
);

export default router;
