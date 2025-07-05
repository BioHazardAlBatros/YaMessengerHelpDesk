import { getKeyByVal,sleep } from "./util";
import type { Chat, Button, File, Image, Sender, Vote, Update, User, Config } from "./types";
import { sendRequest, type Response, type CreateChatRequest, type SendMessageRequest, type UpdateRequest } from "./requests";

export class Bot {
    private readonly token: string;
    private updateOffset: number;
    private userThreads: Map<string,number>;

    private helpdeskChat: Chat;
    private admins: User[];

    constructor(newToken: string,config:Config) {
        this.token = newToken;
        this.helpdeskChat = { type: "group", id:"missing" };
        //SHOULD BE LOADED FROM FILE IF FILE IS PRESENT AND CORRECT
        this.updateOffset = 0;
        this.userThreads = new Map();
    };

    async run(): Promise<void> {
        console.log("Bot enabled. Trying to poll updates...");

        if (this.helpdeskChat.id == "missing")
            await this.createHelpdeskChat();

        while (true)
        {
            const updates: Update[] = await this.getUpdates({limit:25,offset:this.updateOffset});
            updates.forEach(await this.processUpdate);
            await sleep(10000);
          //  this.sendMessage({ chat_id: "123312", text: "Hello world", inline_keyboard: [{ text: "Hello" }] });
        }

    };

    async processUpdate(data: Update): Promise<void> {

        //Getting the max update_id from the UpdateArr to set the new update offset, because every record with id lower than that is not available anymore
        if (data.update_id >= this.updateOffset)
            this.updateOffset = data.update_id + 1;

        //Presumably will ignore the bot itself?
        if (data.from.robot)
            return;

        let botRequest: SendMessageRequest;
        const isFromHelpdeskChat: boolean = (data.chat.type == this.helpdeskChat.type && data.chat.id == this.helpdeskChat.id); // === or ==?

        const hasText: boolean = data.hasOwnProperty("text");
        const hasFiles: boolean = data.hasOwnProperty("file");
        const hasGallery: boolean = data.hasOwnProperty("images");

        //
        if (isFromHelpdeskChat) {
            botRequest = { text: data.text, login: getKeyByVal(this.userThreads, 5) };
        } 
        else {
            let threadID: number;
            if (!this.userThreads.has(data.from.login)) {
                threadID = await this.sendMessage({ text: `Thread with ${data.from.display_name}`, chat_id: this.helpdeskChat.id });
                this.userThreads.set(data.from.login, threadID); //saving thread id to forward messages here
            }
            else
                threadID = this.userThreads.get(data.from.login);
            botRequest = { text: data.text, chat_id: this.helpdeskChat.id, thread_id: threadID };
        }

        const messageID = await this.sendMessage(botRequest);
        if (messageID == -1)
            console.error(`COULDN'T FORWARD THE MESSAGE. Update Data:\n${JSON.stringify(data)}\n Bot Request Data:\n ${JSON.stringify(botRequest)}`)
    }

    async getUpdates(data: UpdateRequest): Promise<Update[]> {
        const res = await sendRequest<UpdateRequest, Response>("messages/getUpdates", data, "Polling");

        //Getting the max update_id from the UpdateArr for calculating the new update offset, because every record with id lower than that is not available anymore
/*        this.updateOffset = res.updates.reduce(
            (max, item): number => { return (item.update_id > max) ? item.update_id : max }, 0) + 1;
*/
        if (process.env.MODE === "DEV")
            console.log(res);

        if (!res.ok)
            return Array() as Update[];
        return res.updates as Update[];
    }

    async sendMessage(data: SendMessageRequest): Promise<number> {
        const res = await sendRequest<SendMessageRequest, Response>("messages/sendText", data, "Send Message");

        if (!res.ok)
            return -1 as number; //impossible ID for error handling

        return res.message_id as number;
    }

    async createChat(data: CreateChatRequest): Promise<string> {
        const res = await sendRequest<CreateChatRequest, Response>("chats/create", data, "Create Chat");

        if (!res.ok)
            return "missing" as string; //impossible ID for error handling

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
}
//
    //|CreateChannel|CreateThread|AddUsers
    //SendMessage|ForwardMessage|SendFile  //Forward by mapping chat_IDs to threads in other chat?
    //GetFile| GetUpdate
