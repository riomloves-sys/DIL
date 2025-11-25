
import { useState, useEffect, useRef } from 'react';
import { uxWatchSupabase } from '../../../supabase/uxWatch_client';
import { uxWatch_detectDrift } from '../utils/uxWatch_sync';

export interface WatchSession {
  id: string;
  chat_id: string;
  host_uid: string;
  partner_uid: string;
  content_type: 'upload' | 'youtube' | 'web' | 'idle';
  content_url: string;
  playback_state: {
    playing: boolean;
    time: number;
    speed: number;
    last_updated: number;
  };
  mode: {
    hostControl: boolean;
  };
}

export const useUxWatchSession = (chatId: string, currentUserUid: string) => {
  const [session, setSession] = useState<WatchSession | null>(null);
  const [driftWarning, setDriftWarning] = useState<string | null>(null);
  
  const videoRef = useRef<any>(null); 
  const sessionRef = useRef<WatchSession | null>(null);
  const lastLocalEventRef = useRef<number>(0);

  const getPartnerUid = () => {
     return chatId.split('_').find(uid => uid !== currentUserUid) || 'unknown';
  };

  // 1. Create Session (or Update)
  const createSession = async (type: string, url: string) => {
    const partnerUid = getPartnerUid();
    
    const { data: existing } = await uxWatchSupabase
      .from('watch_sessions')
      .select('*')
      .eq('chat_id', chatId)
      .single();

    // DEFAULT: HostControl = FALSE (Collaborative Mode)
    // "Is host restriction necessary?" -> No. Let's make it open for everyone.
    const defaultMode = { hostControl: false }; 

    if (existing) {
      const { data } = await uxWatchSupabase
        .from('watch_sessions')
        .update({
          content_type: type,
          content_url: url,
          host_uid: currentUserUid,
          playback_state: { playing: false, time: 0, speed: 1, last_updated: Date.now() },
          updated_at: new Date().toISOString(),
          mode: defaultMode 
        })
        .eq('id', existing.id)
        .select()
        .single();
      setSession(data);
    } else {
      const { data } = await uxWatchSupabase
        .from('watch_sessions')
        .insert({
          chat_id: chatId,
          host_uid: currentUserUid,
          partner_uid: partnerUid,
          content_type: type,
          content_url: url,
          playback_state: { playing: false, time: 0, speed: 1, last_updated: Date.now() },
          mode: defaultMode 
        })
        .select()
        .single();
      setSession(data);
    }
  };

  // 2. Publish Events (Allowed for everyone in Collaborative Mode)
  const publishEvent = async (type: string, payload: any) => {
    if (!session) return;
    
    // RESTRICTION REMOVED: Anyone can control if hostControl is false (default now)
    // If hostControl IS true, only host can control.
    if (session.mode.hostControl && session.host_uid !== currentUserUid && type !== 'reaction' && type !== 'sync_request') {
       return; 
    }

    lastLocalEventRef.current = Date.now();

    // Update DB state for late-joiners
    if (['play', 'pause', 'seek', 'change'].includes(type)) {
       await uxWatchSupabase.from('watch_sessions').update({
           playback_state: { 
               playing: type === 'play', 
               time: payload.time || 0, 
               speed: payload.speed || 1,
               last_updated: Date.now()
           }
       }).eq('id', session.id);
    }

    // Send ephemeral event
    await uxWatchSupabase.from('watch_events').insert({
        session_id: session.id,
        event_type: type,
        payload: payload,
        created_by: currentUserUid
    });
  };

  // 3. Subscribe & Sync
  useEffect(() => {
    if (!chatId) return;

    const fetchSession = async () => {
       const { data } = await uxWatchSupabase.from('watch_sessions').select('*').eq('chat_id', chatId).single();
       if (data) {
           setSession(data);
           sessionRef.current = data;
       }
    };
    fetchSession();

    const channel = uxWatchSupabase.channel(`watch:${chatId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'watch_sessions', filter: `chat_id=eq.${chatId}` }, 
      (payload) => {
         const newSession = payload.new as WatchSession;
         setSession(newSession);
         sessionRef.current = newSession;
      })
      .subscribe();
      
      const eventChannel = uxWatchSupabase.channel(`watch_events:${chatId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'watch_events' }, (payload) => {
            const evt = payload.new;
            // Process events from OTHERS only
            if (sessionRef.current && evt.session_id === sessionRef.current.id && evt.created_by !== currentUserUid) {
                handleIncomingEvent(evt);
            }
        })
        .subscribe();

    return () => { 
        uxWatchSupabase.removeChannel(channel); 
        uxWatchSupabase.removeChannel(eventChannel);
    };
  }, [chatId]);

  // 4. Event Handler
  const handleIncomingEvent = (evt: any) => {
      // If we are in Web Viewer mode, events are handled differently (URL changes)
      if (sessionRef.current?.content_type === 'web') {
          // Web sync logic usually handled by props in component
          return; 
      }

      if (!videoRef.current) return;
      const { event_type, payload } = evt;

      // Ignore old events (> 5 sec)
      if (Date.now() - new Date(evt.created_at).getTime() > 5000 && event_type !== 'change') return;

      switch(event_type) {
          case 'play':
              videoRef.current.play();
              if (payload.time && Math.abs(videoRef.current.getCurrentTime() - payload.time) > 1.0) {
                  videoRef.current.seekTo(payload.time);
              }
              break;
          case 'pause':
              videoRef.current.pause();
              break;
          case 'seek':
              videoRef.current.seekTo(payload.time);
              break;
          case 'sync':
              const drift = Math.abs(videoRef.current.getCurrentTime() - payload.time);
              if (drift > 2) {
                  setDriftWarning(`Syncing... (${drift.toFixed(1)}s drift)`);
                  videoRef.current.seekTo(payload.time);
                  setTimeout(() => setDriftWarning(null), 2000);
              }
              break;
          default:
              break;
      }
  };

  // 5. Leader Sync Loop (Sends sync pings if I am the host OR if mode is collaborative and I started it)
  // Simplified: The 'Host' in DB does the periodic sync pulse to keep DB updated.
  useEffect(() => {
     if (!session || session.host_uid !== currentUserUid) return;
     
     const interval = setInterval(() => {
         // Only sync if playing and player is ready
         if (videoRef.current && !videoRef.current.isPaused && !videoRef.current.isPaused()) {
             uxWatchSupabase.from('watch_sessions').update({
                 playback_state: {
                     playing: true,
                     time: videoRef.current.getCurrentTime(),
                     speed: 1,
                     last_updated: Date.now()
                 }
             }).eq('id', session.id);
         }
     }, 5000); // 5s heartbeat

     return () => clearInterval(interval);
  }, [session, currentUserUid]);

  return {
      session,
      createSession,
      publishEvent,
      videoRef,
      driftWarning,
      isHost: session?.host_uid === currentUserUid // Still useful for UI badges
  };
};
