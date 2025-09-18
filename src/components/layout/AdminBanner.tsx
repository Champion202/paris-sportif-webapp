// AdminBanner.tsx
type AdminBannerProps = {
  modelUsed: string;
  matchesAnalyzed: number;
  analysisTimestamp: string;
};

const AdminBanner = ({ modelUsed, matchesAnalyzed, analysisTimestamp }: AdminBannerProps) => {
  // Conditionner la visibilité uniquement aux développeurs/admins
  const isDevMode = import.meta.env.DEV;

  if (!isDevMode) return null;

  return (
    <div className="w-full bg-yellow-100 text-yellow-900 py-1 px-4 text-xs font-mono">
      🛠️ <strong>Debug Info:</strong> Modèle utilisé: {modelUsed} | Nb Matchs analysés: {matchesAnalyzed} | Analyse à: {analysisTimestamp}
    </div>
  );
};

export default AdminBanner;
