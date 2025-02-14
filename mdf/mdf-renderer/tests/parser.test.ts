// tests/parser.test.ts
import {describe} from "node:test";
import test from "node:test";
import {MDFParser} from "@/parser";
import {expect} from "sucrase/dist/types/parser/traverser/util";

describe('MDF Parser', () => {
    test('应正确解析食材块', () => {
        const input = `
      @ingredients {
        面粉: {
          amount: 200g ±5%
          substitutes: [全麦面粉]
        }
      }
    `;

        const parser = new MDFParser(input);
        const ast = parser.parse();

        expect(ast.ingredients).toHaveLength(1);
        expect(ast.ingredients[0].substitutes[0]).toBe('全麦面粉');
    });

    test('应检测无效单位', () => {
        const input = `@ingredients { 盐: { amount: 200lightyears } }`;
        expect(() => parser.parse(input)).toThrowError('无效单位');
    });
});