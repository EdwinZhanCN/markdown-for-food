// src/lexer.ts

import * as console from "node:console";

type TokenType =
    | 'BLOCK_START' | 'BLOCK_END'
    | 'LBRACE' | 'RBRACE' | 'LBRACKET' | 'RBRACKET'
    | 'IDENTIFIER' | 'COLON' | 'COMMA' | 'DASH' | 'EQUALS' | 'PLUS_MINUS'
    | 'NUMBER' | 'UNIT' | 'PERCENT' | 'STRING' | 'COMMENT' | 'NEWLINE' | 'EOF';

interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}

type LexerState = 'DEFAULT' | 'IN_BLOCK';

const CORE_PATTERNS: {
    [key in LexerState]: Array<[RegExp, TokenType | null, LexerState?]>
} = {
    DEFAULT: [
        [/^@([\p{L}_][\p{L}0-9_]*)/u, 'BLOCK_START', 'IN_BLOCK'], // 优先处理块开始
        [/^\}/, 'RBRACE'],
        [/^{/, 'LBRACE'],
    ],
    IN_BLOCK: [
        [/^\}/, 'BLOCK_END', 'DEFAULT'],
        [/^{/, 'LBRACE', 'IN_BLOCK'],
    ]
};

const COMMON_PATTERNS: Array<[RegExp, TokenType | null]> = [
    // 调整顺序：特殊符号优先
    [/^\s+/, null],
    [/^(\r?\n|\r)/, 'NEWLINE'],
    [/^\/\/.*/, 'COMMENT'],
    [/^:/, 'COLON'],
    [/^,/, 'COMMA'],
    [/^\[/, 'LBRACKET'],
    [/^\]/, 'RBRACKET'],
    [/^-/, 'DASH'],
    [/^=/, 'EQUALS'],
    [/^±/, 'PLUS_MINUS'],
    [/^(?:\d+\.?\d*|\.\d+)/, 'NUMBER'],
    [/^(?:g|kg|ml|L|°C|°F|分钟|小时|人份)/, 'UNIT'],
    [/^%/, 'PERCENT'],
    [/^"(?:\\["\\]|[^"])*"/, 'STRING'],
    // 将IDENTIFIER放在最后
    [/^[\p{L}_][\p{L}0-9_]*/u, 'IDENTIFIER'],
];

export class MDFLexer {
    private pos = 0;
    private line = 1;
    private column = 1;
    private stateStack: LexerState[] = ['DEFAULT'];

    //threshold for recursion
    private recursionThreshold = 1000;

    private readonly input: string;

    constructor(input: string) {
        this.input = input.normalize();
    }

    tokenize(): Token[] {
        const tokens: Token[] = [];
        let token: Token | null;

        while ((token = this.nextToken()) !== null) {
            if (token.type !== 'COMMENT') {
                tokens.push(token);
            }
        }

        tokens.push(this.createEOFToken());
        return tokens;
    }

    private nextToken(): Token | null {

        // 无用空格处理
        if (this.recursionThreshold <= 0) {
            throw new Error('词法分析器进入0循环, 输入太多空格！');
        }

        if (this.pos >= this.input.length) return null;

        // 优先处理状态相关规则
        const currentState = this.stateStack[this.stateStack.length - 1];
        for (const [regex, type, nextState] of CORE_PATTERNS[currentState]) {

            // 匹配正则表达式
            const match = this.match(regex);

            // 如果没有匹配，继续下一个规则
            if (!match) continue;

            // 处理状态转换
            this.handleStateTransition(nextState);
            return this.createToken(match[0], type, match[1]);
        }

        // 处理通用规则
        for (const [regex, type] of COMMON_PATTERNS) {
            const match = this.match(regex);
            if (!match) continue;

            if (type === null) {
                // 处理空格
                this.recursionThreshold -= 1;
                this.column +=1;
                return this.nextToken()
            }
            return this.createToken(match[0], type);
        }

        throw this.createSyntaxError();
    }


    /**
     * 处理状态转换, 如果nextState为空，则不进行状态转换
     * @param nextState
     * @private
     */
    private handleStateTransition(nextState?: LexerState) {
        if (!nextState) return;

        if (nextState === 'DEFAULT') {
            if (this.stateStack.length > 1) {
                this.stateStack.pop();
            }
        } else {
            this.stateStack.push(nextState);
        }
    }

    private createToken(raw: string, type: TokenType | null, group?: string): Token | null {
        const startLine = this.line;
        const startColumn = this.column;

        // 处理不需要生成Token的情况（如空格）
        if (type === null) {
            this.updatePosition(raw);
            return null; // 返回null，让外部循环继续处理
        }

        // 更新位置信息
        this.updatePosition(raw);

        return {
            type,
            value: group ?? raw,
            line: startLine,
            column: startColumn
        };
    }

    private createEOFToken(): Token {
        return {
            type: 'EOF',
            value: '',
            line: this.line,
            column: this.column
        };
    }

    private updatePosition(raw: string) {
        const segments = raw.split('\n');

        if (segments.length > 1) {
            // 多行处理
            this.line += segments.length - 1;
            this.column = segments[segments.length - 1].length + 1;
        } else {
            // 单行处理
            this.column += raw.length;
        }
    }

    /**
     * 匹配正则表达式并更新位置
     * @param regex
     * @private
     */
    private match(regex: RegExp): RegExpExecArray | null {
        // 使用锚点匹配，确保从当前位置开始匹配
        const anchored = new RegExp(`^${regex.source}`, regex.flags);

        // 匹配并更新位置
        const match = anchored.exec(this.input.slice(this.pos));

        // 更新位置
        if (match) {
            this.pos += match[0].length;
        }

        return match;
    }

    /**
     * 创建一个语法错误
     * @private
     */
    private createSyntaxError(): SyntaxError {
        const char = this.input[this.pos] || 'EOF';
        return new SyntaxError(
            `无法识别的字符 '${char}' 在行 ${this.line} 列 ${this.column}`
        );
    }
}