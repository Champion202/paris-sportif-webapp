// src/components/MatchCard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

type Match = {
  id: number;
  home_team: string;
  away_team: string;
  time: string;
  logo_home?: string;
  logo_away?: string;
};

type MatchCardProps = {
  match: Match;
  isLive?: boolean; // <-- Ajouté pour style spécial live
};

export const MatchCard = ({ match, isLive }: MatchCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      className={`bg-white rounded-2xl shadow-md px-4 py-3 flex items-center justify-between hover:shadow-lg transition-all cursor-pointer relative border-2 ${
        isLive
          ? "border-red-500 animate-pulse"
          : "border-transparent"
      }`}
    >
      {/* Badge LIVE animé */}
      {isLive && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg animate-bounce z-10">
          LIVE
        </div>
      )}

      <div className="flex items-center space-x-2 sm:space-x-4">
        <img
          src={match.logo_home || "https://placehold.co/40x40"}
          alt={match.home_team}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border"
        />
        <span className="font-medium text-gray-800 text-sm sm:text-base">
          {match.home_team}
        </span>
        <span className="text-gray-500">vs</span>
        <span className="font-medium text-gray-800 text-sm sm:text-base">
          {match.away_team}
        </span>
        <img
          src={match.logo_away || "https://placehold.co/40x40"}
          alt={match.away_team}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border"
        />
      </div>
      <div className={`text-sm sm:text-base font-semibold ${isLive ? "text-red-600" : "text-blue-600"}`}>
        ⏰ {match.time}
      </div>
    </div>
  );
};
