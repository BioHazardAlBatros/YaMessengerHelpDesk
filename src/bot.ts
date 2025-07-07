import { getKeyByVal,sleep } from "./util";
import type { Chat, Button, File, Image, Sender, Vote, Update, User, Settings } from "./types";
import { sendRequest, type Response, type CreateChatRequest, type SendMessageRequest, type UpdateRequest } from "./requests";


export class Bot {
    private readonly token: string; // maybe unneeded
    private botEnabled: boolean;
    private failedUpdates: Array<Update>;

    private updateOffset: number;

    private userChats: Map<string, string>;
    private admins: Array<User>;
//    private userThreads: Map<string,number>;
//    private helpdeskChat: Chat;


    constructor(newToken: string, newSettings: Settings) {
        this.token = newToken;
        this.botEnabled = true;
        this.failedUpdates = new Array<Update>();

//        this.helpdeskChat = { type: "group", id: "missing" };         //SHOULD BE LOADED FROM FILE IF FILE IS PRESENT AND CORRECT
        this.admins = newSettings.admins;
        this.updateOffset = newSettings.updateOffset;
        this.userChats = newSettings.userChats;
//        this.userThreads = new Map<string,number>();
    };

    async run(): Promise<void> {
        console.log("Bot enabled. Trying to poll updates...");

//Currently not needed
/*        if (this.helpdeskChat.id == "missing") //ask for confirmation????????
            await this.createHelpdeskChat();
*/
        while (this.botEnabled)
        {
            const updates: Update[] = await this.getUpdates({limit:25,offset:this.updateOffset});
            updates.forEach(await this.processUpdate,this); //current {this} has to be passed since the context will change inside callback function otherwise
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
        const isFromPrivateChat: boolean = (data.chat.type === "private");
        const hasText: boolean = data.hasOwnProperty("text");
        const hasFiles: boolean = data.hasOwnProperty("file");
        const hasGallery: boolean = data.hasOwnProperty("images");

        if (isFromPrivateChat) {
            let assosiatedChatID: string;

            //Checking if the user already has a designed helpdesk chat, if not - try to create one and forward the message here
            if (!this.userChats.has(data.from.login)) {
                const chatProps: CreateChatRequest = {
                    name: `Helpdesk: ${data.from.display_name}`,
                    desc: `Helpdesk chat with ${data.from.display_name}`,
                    admins: this.admins,
                    channel: false,
                    members: Array()
                };

                assosiatedChatID = await this.createChat(chatProps);
                this.userChats.set(data.from.login, assosiatedChatID);

                if (assosiatedChatID === "missing") {
                    this.failedUpdates.push(data);
                    return;
                }
            }
            else
                assosiatedChatID = this.userChats.get(data.from.login);

            botRequest = { text: data.text, chat_id: assosiatedChatID }; //Maybe put text later?
        }
        else
            botRequest = { text: data.text, login: getKeyByVal(this.userChats, data.chat.id) };
/*
    if(hasText)
        botRequest.text = data.text;
    if(hasFiles) {
        const file: Blob = await this.getFile(data.file.id) // OPENS UP BINARYSTREAM
        botRequest.document = file;
     }
     if(hasGallery){
         const file: Blob
         botRequest.image = file;
     }
*/
        const messageID = await this.sendMessage(botRequest);
        //Errors should be saved for retrying
        if (messageID === -1) {
            console.error(`COULDN'T FORWARD THE MESSAGE. Update Data:\n${JSON.stringify(data)}\n Bot Request Data:\n ${JSON.stringify(botRequest)}`);
            this.failedUpdates.push(data);
        }
    }

        //Commented out due to API roadblock with Update type not having thread_id property. Unify 
/*    async processUpdate(data: Update): Promise<void> {
        //Getting the max update_id from the UpdateArr to set the new update offset, because every record with id lower than that is not available anymore
        if (data.update_id >= this.updateOffset)
            this.updateOffset = data.update_id + 1;

        //Presumably will ignore the bot itself?
        if (data.from.robot)
            return;

        let botRequest: SendMessageRequest;
        const isFromHelpdeskChat: boolean = (data.chat.type === this.helpdeskChat.type && data.chat.id === this.helpdeskChat.id); // === or ==?
        const hasText: boolean = data.hasOwnProperty("text");
        const hasFiles: boolean = data.hasOwnProperty("file");
        const hasGallery: boolean = data.hasOwnProperty("images");

        if (isFromHelpdeskChat) {
            botRequest = { text: data.text, login: getKeyByVal(this.userThreads, 5) };//what a bummer, the api doesn't tell in which thread the update happened
            //maybe it's just undocumented?
        } 
        else {
            let rootMessage: number;
            if (!this.userThreads.has(data.from.login)) {
                rootMessage = await this.sendMessage({ text: `Thread with ${data.from.display_name}`, chat_id: this.helpdeskChat.id });
                this.userThreads.set(data.from.login, rootMessage); //saving thread id to forward messages from this user to main chat
            }
            else
                rootMessage = this.userThreads.get(data.from.login);

            botRequest = { text: data.text, chat_id: this.helpdeskChat.id, thread_id: rootMessage };
        }

        const messageID = await this.sendMessage(botRequest);
        if (messageID == -1)
            console.error(`COULDN'T FORWARD THE MESSAGE. Update Data:\n${JSON.stringify(data)}\n Bot Request Data:\n ${JSON.stringify(botRequest)}`)
            //Such errors should be saved for retrying
    }*/

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

    //Commented out due to API roadblock with Update type not having thread_id property.
/*    async createHelpdeskChat(): Promise<void> {
        const chatProps: CreateChatRequest = {
            name: "Helpdesk",
            desc: "Helpdesk chat",
            admins: this.admins,
            channel: false,
            members:[]
        };
        this.helpdeskChat.id = await this.createChat(chatProps);
        if (this.helpdeskChat.id === "missing")
        {
            console.error("Failed to create main group chat.");
            this.botEnabled = false;
            return;
        }
        await this.sendMessage({ chat_id: this.helpdeskChat.id, text: "Welcome to the Helpdesk Chat." });
    }*/
}
//
    //|CreateChannel|CreateThread|AddUsers
    //SendMessage|ForwardMessage|SendFile  //Forward by mapping logins to threads for main chat?
    //GetFile| GetUpdate
