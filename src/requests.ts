import { type } from "os";
import type { Chat, Button, File, Image, Sender, Vote, Update, User } from "./types";

//File Response opens up a binary stream, needs other response type.
export type Response = {
    ok: boolean;
    description?: string;

    message_id?: number;
    chat_id?: string;
    id?: string;

    chat_link?: string;
    call_link?: string;

    updates?: Update[];
}

type CreateChatRequestChannel = {
    name: string,
    desc: string,
    avatar_url?: string,
    admins?: User[],
    members?: never,
    channel?: true,
    subscribers?: User[]
}

type CreateChatRequestNormal = {
    name: string,
    desc: string,
    avatar_url?: string,
    admins?: User[],
    members?: User[],
    channel?: false,
    subscribers?: never
}

export type CreateChatRequest = CreateChatRequestChannel | CreateChatRequestNormal;

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

export type SendMessageRequest = MessageRequestChat | MessageRequestUser;

export type UpdateRequest = {
    limit?: number;
    offset?: number;
}

type Header = {
    Authorization: string,
    "Content-Type"?: "application/json";
}

const baseURL: string = (process.env.MODE !== "DEV")? process.env.YANDEX_BASE_URL : process.env.MOCK_BASE_URL;

export async function sendRequest<req, res>(endpointRoute: string, data: req, requestName: string = "unnamed", reqMethod: string = "POST", isFile:boolean = false): Promise<res> {

    const reqBody = JSON.stringify(data);
    const reqHeaders: Header = { Authorization: `OAuth ${process.env.TOKEN}` };
    if (!isFile)
        reqHeaders["Content-Type"] = "application/json";

    //fetch should be error handled, what if the servers are unavailable
    const response = await fetch(`${baseURL}/${endpointRoute}`,
        {
            method: reqMethod,
            headers: reqHeaders,
            body: reqBody
        });

    const curTime: String = new Date().toLocaleString();
    console.log(`[${curTime}] ${requestName} request ${reqMethod}`);

    if (process.env.MODE === "DEV")
        console.log("HTTP status:", response.status);

    const result: Response = await response.json();
    if (!result.ok)
        console.error(`Request failed. Reason:${result.description} \nData:${reqBody}\n`);

    return result as res;
}