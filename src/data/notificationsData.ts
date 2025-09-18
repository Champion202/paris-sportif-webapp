// src/data/notificationsData.ts
export type Notification = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

export const notifications: Notification[] = [
  {
    id: "1",
    title: "🎉 Ticket gagné !",
    message: "Félicitations, vous avez gagné sur le match Real Madrid vs Barcelona.",
    date: "2025-06-14 21:30",
    read: false,
  },
  {
    id: "2",
    title: "⚠️ Nouveau match en direct",
    message: "Le match PSG vs Marseille vient de commencer.",
    date: "2025-06-14 20:00",
    read: false,
  },
  {
    id: "3",
    title: "ℹ️ Analyse terminée",
    message: "Votre analyse pour le match Lyon vs Monaco est prête.",
    date: "2025-06-13 19:00",
    read: true,
  },
];
