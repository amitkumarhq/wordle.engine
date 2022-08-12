import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export default model(
    'WordleDB',
    new Schema({
        userId: Number,
        answer: String,
        gameState: Boolean,
        TRIES_LEFT: Number,
        description: [],
    }),
);
