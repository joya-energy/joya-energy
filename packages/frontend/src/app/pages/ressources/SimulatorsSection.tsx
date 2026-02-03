import React from "react";
import SimulatorCard from "./SimulatorCard";
import { SolarIcon, EnergyAuditIcon, CarbonIcon, FinanceIcon } from "@/components/icons/PerformanceIcons";

const SimulatorsSection: React.FC = () => {
  const simulators = [
    {
      icon: <SolarIcon className="w-full h-full" />,
      title: "Audit Solaire & Potentiel d'Économies",
      description: "Visualisez le potentiel solaire de votre site en quelques minutes. Notre simulateur analyse votre toiture, estime la production d'électricité et la rentabilité de votre future installation.",
      features: [
        { bold: "Analyse instantanée", text: "de votre potentiel solaire." },
        { bold: "Estimation précise", text: "des coûts et aides financières." },
        { bold: "Projection claire", text: "de vos économies sur 20 ans." },
      ],
      buttonText: "Lancer l'Audit Solaire",
      accentColor: "orange" as const,
    },
    {
      icon: <EnergyAuditIcon className="w-full h-full" />,
      title: "Audit Énergétique Complet",
      description: "Obtenez une vue à 360° de la performance énergétique de votre bâtiment. Identifiez vos postes de consommation et recevez des recommandations personnalisées.",
      features: [
        { bold: "Cartographie détaillée", text: "de vos flux de consommation." },
        { bold: "Recommandations", text: "chiffrées et priorisées." },
        { bold: "Plan d'action concret", text: "pour une meilleure efficacité." },
      ],
      buttonText: "Démarrer l'Audit Énergétique",
      accentColor: "teal" as const,
    },
    {
      icon: <CarbonIcon className="w-full h-full" />,
      title: "Calculateur d'Empreinte Carbone",
      description: "Mesurez l'impact environnemental de votre activité. Quantifiez vos émissions de CO2 (Scope 1, 2 et 3) et identifiez les leviers de décarbonation.",
      features: [
        { bold: "Conformité", text: "avec les standards de reporting." },
        { bold: "Visualisation simple", text: "de vos sources d'émissions." },
        { bold: "Pistes d'actions", text: "pour votre stratégie bas-carbone." },
      ],
      buttonText: "Calculer mon Empreinte Carbone",
      accentColor: "teal" as const,
    },
    {
      icon: <FinanceIcon className="w-full h-full" />,
      title: "Comparateur de Financements",
      description: "Un projet de transition énergétique est avant tout financier. Comparez les modèles de financement pour trouver la solution adaptée à votre trésorerie.",
      features: [
        { bold: "Comparaison transparente", text: "de plusieurs modèles." },
        { bold: "Simulation des flux", text: "de trésorerie et rentabilité." },
        { bold: "Aide à la décision", text: "pour sécuriser votre investissement." },
      ],
      buttonText: "Comparer les Financements",
      accentColor: "orange" as const,
    },
  ];

  return (
    <section className="section-padding bg-background relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230a3d46' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
      <div className="container relative">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span 
            className="inline-block text-sm font-semibold uppercase tracking-widest text-orange-solar mb-4 opacity-0 animate-fade-in"
          >
            Nos Simulateurs
          </span>
          <h2 
            className="text-3xl sm:text-4xl lg:text-5xl mb-6 opacity-0 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Des Outils Puissants à Votre <span className="text-gradient-orange">Disposition</span>
          </h2>
          <p 
            className="text-lg lg:text-xl text-teal-soft opacity-0 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Chaque simulateur est conçu pour vous donner une vision claire et actionnable de votre projet.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {simulators.map((simulator, index) => (
            <SimulatorCard 
              key={index} 
              {...simulator} 
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SimulatorsSection;
