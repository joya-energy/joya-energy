import React from "react";
import { ClarifyIcon, SavingsIcon, PlanIcon } from "@/components/icons/PerformanceIcons";

interface WhyItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const WhyItem: React.FC<WhyItemProps> = ({ icon, title, description, index }) => (
  <div 
    className="group flex flex-col items-center text-center opacity-0 animate-fade-in-up"
    style={{ animationDelay: `${0.2 + index * 0.15}s` }}
  >
    {/* Icon container with animated background */}
    <div className="relative mb-8">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-orange-solar/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Icon background */}
      <div className="relative w-24 h-24 rounded-2xl icon-container flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
        <div className="w-14 h-14 text-orange-solar">
          {icon}
        </div>
      </div>
      
      {/* Decorative ring */}
      <div className="absolute -inset-3 border-2 border-dashed border-orange-solar/20 rounded-3xl group-hover:border-orange-solar/40 group-hover:rotate-6 transition-all duration-500" />
    </div>
    
    <h4 className="text-xl lg:text-2xl font-semibold mb-4 group-hover:text-orange-solar transition-colors duration-300">
      {title}
    </h4>
    <p className="text-text-body/80 leading-relaxed max-w-sm">{description}</p>
  </div>
);

const WhySection: React.FC = () => {
  const items = [
    {
      icon: <ClarifyIcon className="w-full h-full" />,
      title: "Clarifiez votre situation",
      description: "Obtenez un diagnostic précis de votre consommation, de votre potentiel solaire ou de votre impact carbone.",
    },
    {
      icon: <SavingsIcon className="w-full h-full" />,
      title: "Identifiez les gisements d'économies",
      description: "Chiffrez rapidement les économies potentielles et la rentabilité de vos projets.",
    },
    {
      icon: <PlanIcon className="w-full h-full" />,
      title: "Planifiez vos actions",
      description: "Prenez des décisions éclairées basées sur des données objectives pour construire votre feuille de route énergétique.",
    },
  ];

  return (
    <section className="section-padding relative overflow-hidden gradient-mesh">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-solar/30 to-transparent" />
      
      <div className="container relative">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span 
            className="inline-block text-sm font-semibold uppercase tracking-widest text-orange-solar mb-4 opacity-0 animate-fade-in"
          >
            Pourquoi nos outils
          </span>
          <h2 
            className="text-3xl sm:text-4xl lg:text-5xl mb-6 opacity-0 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            La <span className="text-gradient">Donnée</span> au Service de Votre Performance
          </h2>
          <p 
            className="text-lg lg:text-xl text-teal-soft opacity-0 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Avant de pouvoir optimiser, il faut pouvoir mesurer. Nos outils sont le point de départ 
            d'une stratégie énergétique réussie.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {items.map((item, index) => (
            <WhyItem 
              key={index} 
              {...item} 
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhySection;
