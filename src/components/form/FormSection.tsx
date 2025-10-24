import React from "react";
import Section from "../layout/Section";
import FormMiniCard from "../ui/FormMiniCard";

type FormData =
  | {
      n: number;
      win: number;
      draw: number;
      loss: number;
      gf_avg: number;
      ga_avg: number;
      seq: string;
    }
  | undefined;

interface FormSectionProps {
  homeTeamName: string;
  awayTeamName: string;

  /** 🔥 Forme (générale par venue) */
  homeTeamHomeForm: FormData; // forme domicile de l'équipe à domicile
  awayTeamAwayForm: FormData; // forme extérieur de l'équipe à l'extérieur

  /** 🤝 Face à face (calculée depuis la liste H2H filtrée par rôle) */
  h2hHomeAtHomeForm: FormData; // forme domicile de l'équipe à domicile dans les H2H où elle était à domicile
  h2hAwayAtAwayForm: FormData; // forme extérieur de l'équipe à l'extérieur dans les H2H où elle était à l'extérieur
}

const FormSection: React.FC<FormSectionProps> = ({
  homeTeamName,
  awayTeamName,
  homeTeamHomeForm,
  awayTeamAwayForm,
  h2hHomeAtHomeForm,
  h2hAwayAtAwayForm,
}) => {
  return (
    <>
      {/* ===================== 🔥 FORMES ===================== */}
      <Section title="🔥 Forme">
        {/* Équipe domicile: uniquement forme à domicile */}
        <div className="mb-3">
          <div className="text-base font-semibold mb-2">Forme {homeTeamName}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="font-medium mb-1">Forme domicile</div>
              <FormMiniCard data={homeTeamHomeForm} />
            </div>
          </div>
        </div>

        {/* Équipe extérieur: uniquement forme à l’extérieur */}
        <div className="mb-1">
          <div className="text-base font-semibold mb-2">Forme {awayTeamName}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="font-medium mb-1">Forme à l’extérieur</div>
              <FormMiniCard data={awayTeamAwayForm} />
            </div>
          </div>
        </div>
      </Section>

      {/* ===================== 🤝 FACE À FACE ===================== */}
      <Section title="🤝 Face à face">
        {/* Domicile: forme domicile dans les H2H où l’équipe à domicile l’était vraiment */}
        <div className="mb-3">
          <div className="text-base font-semibold mb-2">
            {homeTeamName} — matches H2H joués à domicile
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="font-medium mb-1">Forme domicile (H2H)</div>
              <FormMiniCard data={h2hHomeAtHomeForm} />
            </div>
          </div>
        </div>

        {/* Extérieur: forme extérieur dans les H2H où l’équipe à l’extérieur l’était vraiment */}
        <div>
          <div className="text-base font-semibold mb-2">
            {awayTeamName} — matches H2H joués à l’extérieur
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="font-medium mb-1">Forme à l’extérieur (H2H)</div>
              <FormMiniCard data={h2hAwayAtAwayForm} />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
};

export default FormSection;
