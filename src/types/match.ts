// src/types/match.ts

export type APIFootballScore = {
  halftime?: { home?: number; away?: number };
  fulltime?: { home?: number; away?: number };
  extratime?: { home?: number; away?: number };
  penalty?: { home?: number; away?: number };
};

export type MatchStats = {
  last5Home?: any[];
  last5Away?: any[];
  headToHead?: any[];
  advanced?: any[];
};

export type UISuggestion = { risk: string; text: string };

export type FeaturesUsed = {
  context?: {
    league_name?: string;
    league_id?: number;
    season?: number | string;
    kickoff_iso?: string;
    venue_name?: string;
    venue_city?: string;
  };
  standings?: {
    league_size?: number;
    rank_delta_norm?: number;
    home_rank?: number;
    home_points?: number;
    away_rank?: number;
    away_points?: number;
    home?: { rank?: number; points?: number };
    away?: { rank?: number; points?: number };
  };
  form?: {
    home_form_last5?: { W?: number; D?: number; L?: number; seq?: string; gf_avg?: number; ga_avg?: number };
    away_form_last5?: { W?: number; D?: number; L?: number; seq?: string; gf_avg?: number; ga_avg?: number };
    h2h_compact?: { home_win?: number; draw?: number; away_win?: number };
  };
  stats_avgs?: { home?: any; away?: any };
  signals?: Record<string, any> & {
    probs_adjusted?: { home?: number; draw?: number; away?: number };
  };
  home_advantage?: { applied?: boolean; coef?: number };
  market?: {
    source?: string;
    is_live?: boolean;
    odds?: { home?: number; draw?: number; away?: number };
    implied_probs?: { home?: number; draw?: number; away?: number };
  };
  composition?: {
    home?: {
      team_id?: number;
      xi?: { id?: number; name?: string; number?: number; pos?: string }[];
      bench?: { id?: number; name?: string; number?: number; pos?: string }[];
      out?: { id?: number; name?: string; reason?: string; status?: string }[];
    };
    away?: {
      team_id?: number;
      xi?: { id?: number; name?: string; number?: number; pos?: string }[];
      bench?: { id?: number; name?: string; number?: number; pos?: string }[];
      out?: { id?: number; name?: string; reason?: string; status?: string }[];
    };
  };
  scorer_weights?: {
    home?: Record<string, number>;
    away?: Record<string, number>;
  };
  missing_players_impact?: {
    home?: { impact?: number; details?: { player_id?: number; name?: string; reason?: string; weight?: number }[] };
    away?: { impact?: number; details?: { player_id?: number; name?: string; reason?: string; weight?: number }[] };
  };
  raw_subset?: any;
  players_index?: Record<string, string>;
};

export type MarketUsed = {
  source?: string;
  is_live?: boolean;
  odds?: { home?: number; draw?: number; away?: number; [k: string]: any };
  implied_probs?: { home?: number; draw?: number; away?: number; overround?: number };
};

export type MatchDetails = {
  id: number;
  home_team: string;
  away_team: string;
  logo_home?: string;
  logo_away?: string;
  time: string;
  is_live?: boolean;
  stats?: MatchStats;
  predictions?: UISuggestion[];
  message?: string;
  details_debug?: { no_suggestion_reason?: string; model_reason?: string };
  model?: string;
  features_used?: FeaturesUsed;
  market_used?: MarketUsed;
};
