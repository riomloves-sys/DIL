
// @ts-nocheck
import { uxWatch_normalizeTime, uxWatch_detectDrift, uxWatch_parseYouTubeId } from '../utils/uxWatch_sync';

describe('Watch Party Utils', () => {
  
  test('YouTube ID Parsing', () => {
    expect(uxWatch_parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(uxWatch_parseYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(uxWatch_parseYouTubeId('invalid')).toBeNull();
  });

  test('Drift Detection', () => {
    expect(uxWatch_detectDrift(10, 10.5, 1)).toBe(false);
    expect(uxWatch_detectDrift(10, 12, 1)).toBe(true);
  });

  test('Time Normalization', () => {
    expect(uxWatch_normalizeTime(10.123456)).toBe(10.123);
    expect(uxWatch_normalizeTime(-5)).toBe(0);
  });

});
