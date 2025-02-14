// src/parser.ts
import { MDFLexer } from '@/lexer';
export class MDFParser {
    constructor(private lexer: MDFLexer) {}

    parseBlock(): BlockNode {
        const block = { type: '', content: {} };
        this.expect('BLOCK_START');

        block.type = this.lexer.currentToken!.value;

        while (!this.peek('BLOCK_END')) {
            const key = this.expect('IDENTIFIER').value;
            this.expect('COLON');
            const value = this.parseValue();
            block.content[key] = value;
        }

        this.expect('BLOCK_END');
        return block;
    }

    private parseValue(): any {
        if (this.peek('STRING')) return this.parseString();
        if (this.peek('NUMBER')) return this.parseNumber();
        if (this.peek('LBRACE')) return this.parseObject();
        if (this.peek('LBRACKET')) return this.parseArray();
        return this.lexer.nextToken()!.value;
    }

    private parseIngredient(): IngredientNode {
        // 实现食材的复杂解析逻辑
    }
}