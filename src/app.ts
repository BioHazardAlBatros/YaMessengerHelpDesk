import "dotenv/config";
import { Bot } from "./bot";
import { loadConfig } from "./util"

const helpdeskBot = new Bot(process.env.TOKEN, loadConfig());

helpdeskBot.run();

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////