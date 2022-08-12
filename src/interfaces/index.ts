export interface GameConfig {
    ANSWER: string;
    TRIES_LEFT: number;
    WORDS: any[];
}

export interface SchemaData {
    userId: number;
    answer?: string;
    gameState: boolean;
    TRIES_LEFT: number;
    description: any[];
}

export interface isValidDocs {
    isValid: boolean;
    reason: string;
}
