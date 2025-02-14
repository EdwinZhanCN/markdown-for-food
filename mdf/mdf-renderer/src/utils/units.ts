// src/utils/units.ts
const UNIT_CONVERSIONS = new Map([
    ['tbsp', { base: 'ml', factor: 15 }],
    ['cup', { base: 'ml', factor: 240 }],
    ['斤', { base: 'g', factor: 500 }]
]);

export function convertUnit(amount: string, targetUnit: string): number {
    const [_, value, unit] = amount.match(/(\d+)(\D+)/) || [];
    if (!UNIT_CONVERSIONS.has(unit) || !UNIT_CONVERSIONS.has(targetUnit)) {
        throw new Error('不支持的单位转换');
    }

    const baseValue = parseFloat(value) * UNIT_CONVERSIONS.get(unit)!.factor;
    return baseValue / UNIT_CONVERSIONS.get(targetUnit)!.factor;
}