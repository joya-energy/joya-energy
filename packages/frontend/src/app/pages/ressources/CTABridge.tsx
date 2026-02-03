import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { FloatingShape } from "@/components/decorative/Shapes";

const CTABridge: React.FC = () => {
  return (
    <section className="relative overflow-hidden gradient-cta section-padding">
      {/* Pattern overlay */}
      <div className="absolute inset-0 pattern-grid" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-solar/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-soft/15 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />
      
      {/* Floating decorations */}
      <FloatingShape 
        variant="ring"
        className="absolute top-20 right-[10%] w-20 h-20 text-text-on-dark/10 animate-float hidden lg:block"
      />
      <FloatingShape 
        variant="hexagon"
        className="absolute bottom-20 left-[10%] w-16 h-16 text-orange-solar/20 animate-float-delayed hidden lg:block"
      />
      
      <div className="container relative z-10 max-w-4xl text-center">
        {/* Icon */}
        <div 
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-solar/20 border border-orange-solar/30 mb-8 opacity-0 animate-scale-in"
        >
          <Sparkles className="w-8 h-8 text-orange-solar" />
        </div>
        
        <h2 
          className="text-3xl sm:text-4xl lg:text-5xl text-text-on-dark mb-6 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          Vous avez les résultats.{" "}
          <span className="text-gradient-orange">Et maintenant ?</span>
        </h2>
        
        <p 
          className="text-lg lg:text-xl text-text-on-dark/85 leading-relaxed mb-10 max-w-3xl mx-auto opacity-0 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          Une simulation est une première étape essentielle, mais la vraie valeur se crée dans l'action. 
          Nos experts sont là pour analyser vos résultats avec vous, identifier les subtilités de votre 
          projet et le transformer en un plan d'action concret et financé.
        </p>
        
        <div 
          className="opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.35s" }}
        >
          <Button variant="cta" size="xl" className="glow-orange group">
            Discuter de mes résultats avec un expert
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        
        {/* Trust indicators */}
        <div 
          className="flex flex-wrap items-center justify-center gap-6 mt-12 text-text-on-dark/60 text-sm opacity-0 animate-fade-in"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Consultation gratuite</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Réponse sous 24h</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Sans engagement</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTABridge;
