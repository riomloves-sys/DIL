// @ts-nocheck
import { uxCall_getPeerConfig } from '../../src/features/uxCall/utils/uxCall_webrtc';

describe('uxCall WebRTC Utils', () => {
  test('should return default ICE servers if no env var', () => {
    const config = uxCall_getPeerConfig();
    expect(config.iceServers).toBeDefined();
    expect(config.iceServers?.length).toBeGreaterThanOrEqual(2);
  });

  test('should parse custom TURN servers', () => {
    process.env.NEXT_PUBLIC_TURN_SERVERS = JSON.stringify([{ urls: 'turn:test' }]);
    const config = uxCall_getPeerConfig();
    const hasTest = config.iceServers?.some(s => s.urls === 'turn:test');
    expect(hasTest).toBe(true);
  });
});