export type Config = {
    updateOffset: number,
    userThreads: Map<string, number>,
    helpdeskChat: Chat,
    admins: User[];
}


export type Chat = {
    type: "private" | "group" | "channel";
    id?: string;
}
export type Button = {
    text: string;
    callback_data?: string;
}

export type File = {
    id: string;
    name: string;
    size: number;
}

export type Image = {
    file_id: string;
    width: number;
    height: number;
    size?: number;
    name?: string;
};

export type Sticker = {
    id: string;
    set_id: string;
}

type SenderMisc = {
        display_name?: string;
        robot?: boolean;
};
interface SenderChannel extends SenderMisc {
    id: string;
    login?: never;
};
interface SenderChat extends SenderMisc {
    login: string;
    id?: never;
};

export type Sender = SenderChannel | SenderChat;

export type Vote = {
    timestamp: number;
    user: Sender;
}

export type Update = {
    from: Sender;
    chat: Chat;
    text?: string;
    timestamp: number;
    message_id: number;
    update_id: number;
    forwarded_messages?: Update[];
    file?: File;
    images?: Image[][];
}

export type User = {
    login: string;
}