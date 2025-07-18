//import { type } from "os";
import type { Chat, Button, File, Image, Sender, Vote, Update, User } from "./types";

//File Response opens up a binary stream, needs other response type.
export type Response = {
    ok: boolean;
    detail?: string; //<---actually used
    description?: string; //<---from documentation

    message_id?: number;
    chat_id?: string;
    id?: string;

    chat_link?: string;
    call_link?: string;

    updates?: Update[];
}

export type FileStreamResponse = {

}

export type GetFileRequest = {
    file_id: string;
}

type MediaRequestBase = {
    chat_id?: string;
    login?: string;
    thread_id?: number; //message's timestamp
}

export interface SendFileRequest extends MediaRequestBase {
    document: Buffer;
}

export interface SendImageRequest extends MediaRequestBase {
    image: Buffer;
}

export interface SendGalleryRequest extends MediaRequestBase {
    images: Buffer[];
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

const baseURL: string = (process.env.MODE === "DEV")? process.env.YANDEX_BASE_URL : process.env.MOCK_BASE_URL;

export async function sendRequest<req, res>(endpointRoute: string, data: req, requestName: string = "unnamed", reqMethod: string = "POST", isFile:boolean = false): Promise<res> {

    const reqBody = (reqMethod === "POST") ? JSON.stringify(data) : undefined;
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
        console.error(`Request failed. Reason: ${result.detail} \nData:${reqBody}\n`);

    return result as res;
}


export async function checkConnection(): Promise<boolean> {
    const reqHeaders: Header = { Authorization: `OAuth ${process.env.TOKEN}` };

    try {
        const response = await fetch(`${baseURL}/`,
            {
                method: "GET",
                headers: reqHeaders,
            });
        if (process.env.MODE === "DEV")
            console.log("HTTP status:", response.status);

        if (response.status === 404)
            return true;
    }
    catch (error) {
        console.error(`Connection to the server failed. Reason:${error}`);
        return false;
    }
}