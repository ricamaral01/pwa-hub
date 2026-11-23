import {describe,it,expect} from 'vitest';
import {decimalText,decimalValue} from './presentation';
describe('decimal presentation preserves canonical payloads',()=>{
 it('shows a comma without changing precision',()=>{expect(decimalText('0.50')).toBe('0,50');expect(decimalText(3.5)).toBe('3,5');});
 it('keeps the dot representation used by the API',()=>{expect(decimalValue('0,50')).toBe('0.50');expect(decimalValue('3.5')).toBe('3.5');});
 it('preserves intermediate editing states',()=>{expect(decimalText('')).toBe('');expect(decimalValue('-')).toBe('-');expect(decimalValue('0,')).toBe('0.');});
});
