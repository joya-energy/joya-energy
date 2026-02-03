import React from "react";
import KnowledgeCard from "./KnowledgeCard";
import { GuideIcon, CaseStudyIcon, FAQIcon } from "@/components/icons/PerformanceIcons";

const KnowledgeHub: React.FC = () => {
  const articles = [
    {
      icon: <GuideIcon className="w-full h-full" />,
      badge: "Guide",
      title: "Comment calculer et optimiser le ROI d'une installation solaire ?",
      description: "Découvrez les métriques clés, les aides disponibles et les erreurs à éviter pour maximiser la rentabilité de votre projet photovoltaïque.",
      linkText: "Lire le guide",
      href: "#",
    },
    {
      icon: <CaseStudyIcon className="w-full h-full" />,
      badge: "Cas Client",
      title: "Comment un audit énergétique a permis à une PME de réduire sa facture de 18%",
      description: "Analyse d'un cas réel, des premières mesures aux actions implémentées, et les résultats obtenus sur 12 mois.",
      linkText: "Découvrir le cas client",
      href: "#",
    },
    {
      icon: <FAQIcon className="w-full h-full" />,
      badge: "FAQ",
      title: "Le Tiers-Investissement et le modèle ESCO, expliqués simplement",
      description: "Votre projet peut-il être financé à 100% par un tiers ? Comprenez le fonctionnement et les avantages de ce modèle.",
      linkText: "Comprendre le modèle",
      href: "#",
    },
  ];

  return (
    <section className="section-padding bg-background relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-bg-light to-transparent pointer-events-none" />
      
      <div className="container relative">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span 
            className="inline-block text-sm font-semibold uppercase tracking-widest text-orange-solar mb-4 opacity-0 animate-fade-in"
          >
            Centre de Ressources
          </span>
          <h2 
            className="text-3xl sm:text-4xl lg:text-5xl mb-6 opacity-0 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Approfondissez vos <span className="text-gradient">Connaissances</span>
          </h2>
          <p 
            className="text-lg lg:text-xl text-teal-soft opacity-0 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Pour aller plus loin, consultez nos guides et analyses rédigés par nos experts.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {articles.map((article, index) => (
            <KnowledgeCard 
              key={index} 
              {...article} 
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default KnowledgeHub;
