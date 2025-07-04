import fs from 'fs';

import { sleep } from "./util";
import type { Chat, Button, File, Image, Sender, Vote, Update, User } from "./types";
import { sendRequest, type Response, type CreateChatRequest, type SendMessageRequest, UpdateRequest } from "./requests";

export class Bot {
    private readonly token: string;
    private updateOffset: number;
    private userThreads: Map<string, string>;

    private helpdeskChat: Chat;
    private admins: User[];

    constructor(newToken: string,config:string) {
        this.token = newToken;
        this.helpdeskChat = { type: "group" };
        //SHOULD BE LOADED FROM FILE IF FILE IS PRESENT AND CORRECT
        this.helpdeskChat.id = "missing";
    };

    async run(): Promise<void> {
        console.log("Bot enabled. Trying to poll updates...");

        if (this.helpdeskChat.id == "missing")
            await this.createHelpdeskChat();

        while (true)
        {
            await this.getUpdates({});
            await sleep(10000);
          //  this.sendMessage({ chat_id: "123312", text: "Hello world", inline_keyboard: [{ text: "Hello" }] });
        }

    };

    async getUpdates(data: UpdateRequest): Promise<Update[]> {
        const res = await sendRequest<UpdateRequest, Response>("messages/getUpdates", data, "Polling");

        //Getting the max update_id from the UpdateArr for calculating the new update offset, because every record with id lower than that is not available anymore
        this.updateOffset = res.updates.reduce(
            (max, item): number => { return (item.update_id > max) ? item.update_id : max }, 0) + 1;

        if (process.env.MODE === "DEV")
            console.log(res);

        if (!res.ok)
            return [] as Update[];
        return res.updates as Update[];
    }

    async sendMessage(data: SendMessageRequest): Promise<number> {
        const res = await sendRequest<SendMessageRequest, Response>("messages/sendText", data, "Send Message");

        if (!res.ok)
            return 0 as number;

        return res.message_id as number;
    }

    async createChat(data: CreateChatRequest): Promise<string> {
        const res = await sendRequest<CreateChatRequest, Response>("chats/create", data, "Create Chat");

        if (!res.ok)
            return "" as string;

        return res.chat_id as string;
    }

    async createHelpdeskChat(): Promise<void> {
        const chatProps: CreateChatRequest = {
            name: "Helpdesk",
            desc: "Helpdesk chat",
            admins: this.admins,
            channel: false,
            members:[]
        };
        this.helpdeskChat.id = await this.createChat(chatProps);
        await this.sendMessage({ chat_id: this.helpdeskChat.id, text: "Welcome to the Helpdesk Chat." });
    }
//
    //|CreateChannel|CreateThread|AddUsers
    //SendMessage|ForwardMessage|SendFile  //Forward by mapping chat_IDs to threads in other chat?
    //GetFile| GetUpdate
}