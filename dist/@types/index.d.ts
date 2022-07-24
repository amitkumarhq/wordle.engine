import { GameConfig } from './interfaces';
export declare class Engine {
    private WORDS;
    private ANSWER;
    private TRIES_LEFT;
    constructor(config?: GameConfig);
    private getRandom;
    private isValidWord;
    loadGame(): {
        answer: string;
        TRIES_LEFT: number;
        gameState: boolean;
    };
    stopGame(): {
        answer: undefined;
        TRIES_LEFT: number;
        gameState: boolean;
    };
    guess(guess: any, answer: string): Promise<string>;
}
//# sourceMappingURL=index.d.ts.map