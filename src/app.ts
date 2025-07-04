import "dotenv/config";
import type { Chat, Button, File, Image, Sender, Vote, Update, User } from "./types";
//import { Bot } from "./bot";

const base_url = process.env.MOCK_BASE_URL;
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

type MessageRequestBase = {
    text: string;
    payload_id?: string;
    reply_message_id?: number;
    disable_notification?: boolean;
    important?: boolean;
    disable_web_page_preview?: boolean;
    thread_id?: number;
    inline_keyboard?: Button[];
}

interface MessageRequestChat extends MessageRequestBase {
    chat_id: string;
    login?: never;
}

interface MessageRequestUser extends MessageRequestBase {
    chat_id?: never;
    login: string;
}

type MessageRequest = MessageRequestChat | MessageRequestUser;

async function sendRequest<req, res>(endpointRoute: string, data: req,requestName:string = "unnamed"): Promise<res> {
    const reqBody = JSON.stringify(data);
    const response = await fetch(`${base_url}/${endpointRoute}`,
        {
            method: "POST",
            headers: reqHeaders,
            body: reqBody
        });

    const curTime: String = new Date().toLocaleString();
    console.log(`[${curTime}]`);

    if (process.env.MODE === "DEV")
        console.log(`${requestName} request HTTP status:`,response.status);

    const result: Response = await response.json();
    if (!result.ok)
        console.log(`Request failed. Reason:${result.description} \nData:${reqBody}\n[End of message]`);

    return result as res;
}

let botMessages: number[]=[];
async function sendMessage(data: MessageRequest)
{
    const res = await sendRequest<MessageRequest, Response>("messages/sendText", data, "Send Message");
    if (res.ok)
        console.log("Hello World");
}

const res = sendMessage({ chat_id: "123312", text: "", inline_keyboard: [{ text: "Hello" }] });
async function createChat(data: ChatRequest)
{
    const res = await sendRequest<ChatRequest, Response>("chats/create", data, "Create Chat");
}
