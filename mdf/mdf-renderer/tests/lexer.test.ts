// tests/lexer.test.ts
import { MDFLexer } from '@/lexer';

describe('MDF 词法分析器', () => {
    test('应正确处理嵌套块结构', () => {
        const input = `
            @block1 {
                温度: "value1"
                key2: "value2"
            }
        `;

        const lexer = new MDFLexer(input);
        const tokens = lexer.tokenize().filter(t => t.type !== 'NEWLINE');

        expect(tokens.map(t => t.type)).toEqual([
            'BLOCK_START', 'LBRACE',
            'IDENTIFIER', 'COLON', 'STRING',
            'IDENTIFIER', 'COLON', 'STRING',
            'BLOCK_END',
            'EOF'
        ]);
    });

    test('应处理复杂单位', () => {
        const input = '温度: 180°C ±2%';
        const tokens = new MDFLexer(input).tokenize();

        expect(tokens).toEqual([
            { type: 'IDENTIFIER', value: '温度', line: 1, column: 1 },
            { type: 'COLON', value: ':', line: 1, column: 3 },
            { type: 'NUMBER', value: '180', line: 1, column: 5 },
            { type: 'UNIT', value: '°C', line: 1, column: 8 },
            { type: 'PLUS_MINUS', value: '±', line: 1, column: 11 },
            { type: 'NUMBER', value: '2', line: 1, column: 12 },
            { type: 'PERCENT', value: '%', line: 1, column: 13 },
            { type: 'EOF', value: '', line: 1, column: 14 }
        ]);
    });

    test('应检测非法字符', () => {
        const input = '价格: $200';
        expect(() => new MDFLexer(input).tokenize())
            .toThrow(/无法识别的字符 '\$'/);
    });
});