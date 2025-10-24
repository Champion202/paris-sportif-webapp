// src/logic/rules/h2hVenueRule.ts
export type H2HForm = {
  n?: number;
  win?: number;
  draw?: number;
  loss?: number;
  gf_avg?: number;
  ga_avg?: number;
};

export type OneX2Odds = { home?: number; draw?: number; away?: number };
export type OneX2Implied = { home?: number; draw?: number; away?: number };

export type RuleOutput = {
  triggered: boolean;
  pick?: "home" | "away";
  confidence?: number;           // 0..1
  reason?: string;               // court résumé pour logs
  suggestionText?: string;       // phrase prête pour l’UI
  risk?: "faible" | "standard" | "élevé";
};

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/**
 * Règle 0 (H2H par lieu, série parfaite) :
 * - si l'équipe à domicile a n>=minN, 0 nuls, 0 défaites => candidate = home
 * - sinon on teste l'équipe à l'extérieur (dans ses H2H à l'extérieur)
 * - on “confirme” par le marché (implied probs ou cotes brutes)
 * - on calcule une confiance ∈ [0.60, 0.90] en combinant série + marché + marge GF/GA
 */
export function evaluateH2HVenueRule(args: {
  homeTeam: string;
  awayTeam: string;
  homeH2HForm?: H2HForm;       // H2H domicile de l'équipe à domicile
  awayH2HForm?: H2HForm;       // H2H extérieur de l'équipe à l'extérieur
  odds?: OneX2Odds;            // cotes 1X2 si dispo
  implied?: OneX2Implied;      // probabilités implicites si dispo (0..1)
  minN?: number;               // défaut 3
}): RuleOutput {
  const {
    homeTeam,
    awayTeam,
    homeH2HForm,
    awayH2HForm,
    odds,
    implied,
    minN = 3,
  } = args;

  const perfect = (f?: H2HForm) =>
    !!f && (f.n ?? 0) >= minN && (f.draw ?? 0) === 0 && (f.loss ?? 0) === 0 && (f.win ?? 0) === (f.n ?? 0);

  const homePerfect = perfect(homeH2HForm);
  const awayPerfect = perfect(awayH2HForm);

  if (!homePerfect && !awayPerfect) {
    return { triggered: false };
  }

  // Choix initial (si les deux sont “parfaits”, on compare plus loin)
  let pick: "home" | "away" = homePerfect ? "home" : "away";
  let form = pick === "home" ? homeH2HForm! : awayH2HForm!;
  let teamName = pick === "home" ? homeTeam : awayTeam;

  // Si les deux sont parfaits, départage simple : plus grand n, puis meilleur (gf_avg - ga_avg), puis marché
  if (homePerfect && awayPerfect) {
    const fH = homeH2HForm!;
    const fA = awayH2HForm!;
    const scoreH = (fH.n ?? 0) * 1.0 + ((fH.gf_avg ?? 0) - (fH.ga_avg ?? 0)) * 0.5;
    const scoreA = (fA.n ?? 0) * 1.0 + ((fA.gf_avg ?? 0) - (fA.ga_avg ?? 0)) * 0.5;

    if (scoreA > scoreH) {
      pick = "away";
      form = fA;
      teamName = awayTeam;
    } else if (scoreA === scoreH) {
      // départage par marché
      const impH = implied?.home ?? (odds?.home ? 1 / odds.home : undefined);
      const impA = implied?.away ?? (odds?.away ? 1 / odds.away : undefined);
      if ((impA ?? 0) > (impH ?? 0)) {
        pick = "away";
        form = fA;
        teamName = awayTeam;
      }
    }
  }

  // “Validation marché” (pas bloquante, mais booste la confiance)
  const impHome = implied?.home ?? (odds?.home ? 1 / odds.home : undefined);
  const impDraw = implied?.draw ?? (odds?.draw ? 1 / odds.draw : undefined);
  const impAway = implied?.away ?? (odds?.away ? 1 / odds.away : undefined);

  const impPick = pick === "home" ? impHome : impAway;
  const impOpp  = pick === "home" ? impAway : impHome;

  const marketSupports =
    impPick != null &&
    (impOpp == null || impPick > impOpp) &&       // plus forte proba que l’adversaire
    (impPick > (impDraw ?? 0.0));                 // et > au nul

  // Confiance :
  // base 0.60 + 0.05*(n-3) (cap 0.75) + boost marché (0..0.10) + boost marge (0..0.05)
  const n = form.n ?? 0;
  const base = 0.60 + Math.max(0, Math.min(0.15, 0.05 * (n - 3))); // jusqu’à 0.75
  const marketBoost = impPick != null ? clamp((impPick - 0.40) * 0.25, 0, 0.10) : 0; // si prob >40%, boost progressif
  const margin = (form.gf_avg ?? 0) - (form.ga_avg ?? 0);
  const marginBoost = clamp(margin * 0.02, 0, 0.05);

  const confidence = clamp(base + marketBoost + marginBoost, 0.60, 0.90);

  const reason =
    `${teamName} a ${form.win}/${form.n} en H2H ${pick === "home" ? "à domicile" : "à l’extérieur"} ` +
    `(${(form.gf_avg ?? 0).toFixed(2)} GF / ${(form.ga_avg ?? 0).toFixed(2)} GA)` +
    (marketSupports ? " + marché favorable." : ".");

  const suggestionText =
    `Règle H2H/Venue ✔️ : ${teamName} a gagné ${form.win}/${form.n} ` +
    `en confrontations directes ${pick === "home" ? "à domicile" : "à l’extérieur"} ` +
    `${marketSupports ? "et le marché 1X2 le favorise" : " (marché neutre)"} → ` +
    `Choix ${pick === "home" ? "1" : "2"} (${Math.round(confidence * 100)}%).`;

  const risk: RuleOutput["risk"] =
    confidence >= 0.80 ? "faible" : confidence >= 0.70 ? "standard" : "élevé";

  return {
    triggered: true,
    pick,
    confidence,
    reason,
    suggestionText,
    risk,
  };
}
