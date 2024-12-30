"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const { postQuery, getResponse } = require('../controllers/ragieController');
const { slackOauthCallback } = require("../controllers/slackAuthController");
const router = express_1.default.Router();
router.post('/', postQuery);
router.get('/responses', getResponse);
router.get('/slack/install', async (req, res) => {
    await slackOauthCallback(req, res);
});
exports.default = router;
