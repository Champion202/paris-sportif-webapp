// src/components/SuggestionBlock.tsx
import React from "react";

type Prediction = { risk: string; text: string };
type SuggestionBlockProps = {
  predictions?: Prediction[];
  message?: string;
  details_debug?: { no_suggestion_reason?: string };
};

export default function SuggestionBlock({ predictions, message, details_debug }: SuggestionBlockProps) {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-2">
        🎯 Suggestions & Prédictions
      </h3>
      {(!predictions || predictions.length === 0) ? (
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 rounded-lg p-4 my-2">
          <strong>
            {message || "Désolé, nous n'avons pas encore des données fiables sur ce match pour vous faire des suggestions fiables, réessayez l’analyse de ce match plus tard. Merci pour la compréhension."}
          </strong>
          <br />
          {details_debug?.no_suggestion_reason && (
            <span className="text-xs text-gray-600 dark:text-gray-300">
              <b>Détail technique :</b> {details_debug.no_suggestion_reason}
            </span>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {predictions.map((sugg, i) => (
            <li key={i} className="bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100 rounded-lg p-2">
              {sugg.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
