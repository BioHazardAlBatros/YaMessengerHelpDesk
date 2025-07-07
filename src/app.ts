import "dotenv/config";
import { Settings } from "./types";
import { Bot } from "./bot";
import { loadSettings } from "./util"

//const defaultSettings: Settings = { updateOffset: 0, admins: [{login:"CHANGE ME"}] };
const defaultSettings: Settings = { updateOffset: 0, admins: [] };
let loadedSettings: Settings | boolean = loadSettings("bot_data");

if (!loadedSettings)
    loadedSettings = defaultSettings;

const helpdeskBot = new Bot(process.env.TOKEN, loadedSettings as Settings);

helpdeskBot.run();