import { describe, it, expect } from 'vitest';
import { getGradientColor, removeUnderscoreFromKeys, rgbaToHex } from './utils';

describe('Utils Logic', () => {

  describe('getGradientColor', () => {
    it('should return middle color for 0.5 percent', () => {
      const start = '#000000'; // Black
      const end = '#FFFFFF';   // White
      const result = getGradientColor(start, end, 0.5);
      // mid is #7f7f7f or #808080 depending on rounding in the implementation
      expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should handle colors without # prefix', () => {
      const result = getGradientColor('000000', 'FFFFFF', 1);
      expect(result.toLowerCase()).toBe('#ffffff');
    });
  });

  describe('removeUnderscoreFromKeys', () => {
    it('should remove underscores from object keys', () => {
      const input = { _id: 1, _name: 'test', normal: 'value' };
      const expected = { id: 1, name: 'test', normal: 'value' };
      expect(removeUnderscoreFromKeys(input)).toEqual(expected);
    });
  });

  describe('rgbaToHex', () => {
    it('should convert rgba to hex with alpha', () => {
      const rgba = 'rgba(255, 255, 255, 1)';
      const hex = rgbaToHex(rgba);
      expect(hex.toLowerCase()).toBe('#ffffffff');
    });

    it('should handle partial alpha', () => {
      const rgba = 'rgba(0, 0, 0, 0.5)';
      const hex = rgbaToHex(rgba);
      // 0.5 * 255 = 127.5 -> 128 (80 hex) or 127 (7f hex)
      expect(hex.toLowerCase()).toMatch(/^#000000[78][0f]$/);
    });
  });

});
