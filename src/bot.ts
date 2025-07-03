import type { Chat, Button, File, Image, Sender, Vote, Update, User } from "./types";

export class Bot
{
    constructor(readonly token: string) { };
    run(): void { };
    //CreateChat|CreateChannel|CreateThread|AddUsers
    //SendMessage|ForwardMessage|SendFile  //Forward by mapping chat_IDs to threads in other chat?
    //GetFile| GetUpdate
}