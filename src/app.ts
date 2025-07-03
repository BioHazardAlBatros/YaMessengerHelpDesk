import "dotenv/config";
import type { Chat, Button, File, Image, Sender, Vote, Update, User } from "./types";
//import { Bot } from "./bot";

const base_url = process.env.YANDEX_BASE_URL;
//const bot = new Bot(process.env.TOKEN); // use later


//put in other file
const reqHeaders = {
    Authorization: `OAuth ${process.env.TOKEN}`,
    "Content-Type": "application/json"
}


type Response = {
    ok: boolean;
    description?: string;
    message_id?: number;
    chat_id?: number;
    id?: string;
    chat_link?: string;
    call_link?: string;
}

type ChatRequest = {
    name: string,
    desc: string,
    avatar_url?: string,
    admins?: User[],
    members?: User[],
    channel?: boolean,
    subscribers?: User[]
}


async function sendRequest<req, res>(endpoint: string, data: req): Promise<res> {
    const response = await fetch(`${base_url}/${endpoint}`,
        { method: "POST", headers: reqHeaders, body: JSON.stringify(data) });

    return response.json() as Promise<res>;
}


//function createChat(data: ChatRequest)


