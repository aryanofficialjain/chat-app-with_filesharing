import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
    content: String,
    roomId: String,
    userId: String,
    timestamp: Date,
})

export const Message = mongoose.model("Message", messageSchema)


