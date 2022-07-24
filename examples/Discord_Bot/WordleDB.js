import { Schema, model } from 'mongoose';
export default model("WordleDB", new Schema({
    userId: Number,
    answer: String,
    gameState: Boolean,
    TRIES_LEFT: Number,
    description: [],
}));
