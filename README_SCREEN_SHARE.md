
# Screen-Share Watch Together

This feature allows users to share their screen (tab, window, or entire screen) with a partner in real-time using WebRTC and Supabase signaling.

## Setup

1.  **Supabase**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.
2.  **Realtime**: Enable Realtime for your Supabase project.
3.  **TURN Servers (Optional but Recommended)**:
    For production reliability (to bypass firewalls/NATs), provide TURN servers in `NEXT_PUBLIC_TURN_SERVERS`.
    Format: `[{"urls":"turn:your-turn-server.com","username":"user","credential":"pass"}]`

## How to Use

1.  Open a chat.
2.  Click the **Gamepad** icon to open the Game Center.
3.  Click **Screen Share**.
4.  **Host**:
    *   Select the tab/window to share.
    *   **IMPORTANT**: Check "Share system audio" (or "Share tab audio") in the browser dialog if you want sound.
5.  **Partner**:
    *   Receives a toast notification: "Partner started sharing their screen!".
    *   Click **View** to join.

## Troubleshooting

*   **No Audio?**
    *   Ensure the host checked "Share audio" in the browser's screen share prompt.
    *   Ensure the system volume is up.
    *   MacOS requires specific permissions for system audio capture.
*   **Black Screen?**
    *   Check console logs for WebRTC errors.
    *   If on a restricted network, ensure TURN servers are configured.
*   **Connection Failed?**
    *   Refresh both browsers and try again.
    *   Check if `Realtime` is enabled in Supabase.

## Local Testing

1.  Open two different browsers (e.g., Chrome and Firefox) or one Incognito window.
2.  Log in as User A in one, User B in the other.
3.  User A: Start Screen Share -> Pick a YouTube tab -> Share.
4.  User B: Click "View" on the toast.
5.  Verify video and audio sync.
