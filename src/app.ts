//MAIN FILE
import "dotenv/config";
import { Settings } from "./types";
import { Bot } from "./bot";
import { loadSettings } from "./util"

//const defaultSettings: Settings = { limit:25, updateOffset: 0, admins: [{login:"CHANGE ME"}] };
const defaultSettings: Settings = { limit:25, updateOffset: 0, admins: [], userChats: new Map<string, string>() };

let loadedSettings: Settings | boolean = loadSettings(process.env.DATAFILE);

if (!loadedSettings)
    loadedSettings = defaultSettings;

const helpdeskBot = new Bot(process.env.TOKEN, loadedSettings as Settings);

helpdeskBot.run();