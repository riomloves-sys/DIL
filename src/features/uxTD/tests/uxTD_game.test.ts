// @ts-nocheck
import { uxTD_computePoints, uxTD_isSafeContent } from '../utils/uxTD_scoring';

describe('Truth & Dare Logic', () => {
  
  test('Points calculation normal mode', () => {
    expect(uxTD_computePoints('truth', 'normal', false)).toBe(10);
    expect(uxTD_computePoints('dare', 'normal', false)).toBe(20);
  });

  test('Points calculation danger mode', () => {
    // 50 * 1.5 = 75
    expect(uxTD_computePoints('danger', 'danger', false)).toBe(75);
  });

  test('Safety Filter', () => {
    expect(uxTD_isSafeContent('Hello friend')).toBe(true);
    expect(uxTD_isSafeContent('Go kill yourself')).toBe(false);
  });

});