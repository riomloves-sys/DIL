export interface WheelOption {
  id: string;
  label: string;
  type: 'truth' | 'dare' | 'mystery' | 'danger' | 'reward' | 'punish' | 'custom';
  color: string;
}

export interface TDGame {
  id: string;
  chat_id: string;
  turn: string; // UID
  wheel_options: WheelOption[];
  mode: 'normal' | 'danger';
  task_type: string | null;
  task_text: string | null;
  task_status: 'idle' | 'pending' | 'accepted' | 'completed' | 'skipped';
  task_created_by: string | null;
  streak_user1: number;
  streak_user2: number;
  score_user1: number;
  score_user2: number;
  history: Array<{
    task_type: string;
    task_text: string;
    by: string;
    status: string;
    ts: number;
    points: number;
  }>;
  last_confession: string | null;
}

export interface TDPowerCard {
  id: string;
  game_id: string;
  user_uid: string;
  card_type: 'skip_block' | 'double_points' | 'reverse';
  used: boolean;
}
