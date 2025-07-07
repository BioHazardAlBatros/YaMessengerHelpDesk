import { getKeyByVal,sleep, saveSettings } from "./util";
import type { Chat, Button, File, Image, Sender, Vote, Update, User, Settings } from "./types";
import { sendRequest, type Response, type CreateChatRequest, type SendMessageRequest, type UpdateRequest } from "./requests";


export class Bot {
    private readonly token: string; // maybe not needed
    private botEnabled: boolean;
    private failedUpdates: Array<Update>;

    private settings: Settings;

    constructor(newToken: string, newSettings: Settings) {
        this.token = newToken;
        this.botEnabled = true;
        this.failedUpdates = new Array<Update>();
        this.settings = { ...newSettings };
    };

    async run(): Promise<void> {
        const sleepTime: number = 10000; //maybe tie to settings?
        let saveTimer: number = 0;
        console.log("Bot enabled. Trying to poll updates...");

//Currently not needed
/*        if (this.settings.helpdeskChat.id == "missing")
            await this.createHelpdeskChat();
*/
        while(this.botEnabled)
        {
            const updates: Update[] = await this.getUpdates({ limit: this.settings.limit, offset: this.settings.updateOffset });

//            updates.forEach(this.processUpdate, this);
            //Could be asynchronous and maybe even should be, but for now i need it synchronous
            for (const item of updates)
                await this.processUpdate(item);
            await sleep(sleepTime);

            saveTimer += sleepTime;
            if (saveTimer > 20000) {
                saveTimer = 0;
                saveSettings(this.settings, process.env.DATAFILE); //How should we react to save errors?
            }
        }
    };

    async processUpdate(data: Update): Promise<void> {
        //Getting the max update_id from the UpdateArr to set the new update offset, because every record with id lower than that is not available anymore
        if (data.update_id >= this.settings.updateOffset)
            this.settings.updateOffset = data.update_id + 1;

        //Presumably will ignore the bot itself and channels?
        if (data.from.robot || data.chat.type === "channel")
            return;

        const isFromPrivateChat: boolean = (data.chat.type === "private");

        const hasText: boolean = data.hasOwnProperty("text");
        const hasFiles: boolean = data.hasOwnProperty("file");
        const hasGallery: boolean = data.hasOwnProperty("images");
        const hasSticker: boolean = data.hasOwnProperty("sticker");
        const hasForwardedMessages: boolean = data.hasOwnProperty("forwarded_messages");

//        const destinationProp: object = {[(isFromPrivateChat) ? "chat_id" : "login"]:undefined};

        let botTextMessage: SendMessageRequest;

        if (isFromPrivateChat) {
            let assosiatedChatID: string;

            //Checking if the user already has a designated helpdesk chat, if not - try to create one and forward the message here
            if (!this.settings.userChats.has(data.from.login)) {
                const chatProps: CreateChatRequest = {
                    name: `Helpdesk: ${data.from.display_name}`,
                    desc: `Helpdesk chat with ${data.from.display_name}`,
                    admins: this.settings.admins,
                    channel: false,
                    members: Array()
                };

                assosiatedChatID = await this.createChat(chatProps);
                this.settings.userChats.set(data.from.login, assosiatedChatID);
                if (assosiatedChatID === "missing") {
                    this.failedUpdates.push(data);
                    return;
                }
            }
            else
                assosiatedChatID = this.settings.userChats.get(data.from.login);

            botTextMessage = { text: data.text, chat_id: assosiatedChatID };
        }
        else
            botTextMessage = { text: data.text, login: getKeyByVal(this.settings.userChats, data.chat.id) };
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
        const messageID = await this.sendMessage(botTextMessage);
        //Errors should be saved for retrying
        if (messageID === -1) {
            console.error(`COULDN'T FORWARD THE TEXT MESSAGE. Update Data:\n${JSON.stringify(data)}\n Bot Request Data:\n ${JSON.stringify(botTextMessage)}`);
            this.failedUpdates.push(data);
        }
    }

    async getUpdates(data: UpdateRequest): Promise<Update[]> {
        const res = await sendRequest<UpdateRequest, Response>("messages/getUpdates", data, "Polling");

        if (process.env.MODE === "DEV")
            console.log(res);

        if (!res.ok)
            return Array() as Update[];
        return res.updates as Update[];
    }

//Galleries and documents will be both handled by these
    async getFile(): Promise<void> { };
    async sendFile(): Promise<void> { };

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

    //Commented out due to API roadblock with Update type possibly not having thread_id property.
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
    //SendFile
    //GetFile
