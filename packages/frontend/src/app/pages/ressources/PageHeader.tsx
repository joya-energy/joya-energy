import React from "react";
import { FloatingShape, SunRays } from "@/components/decorative/Shapes";

const PageHeader: React.FC = () => {
  return (
    <section className="relative overflow-hidden gradient-hero min-h-[70vh] flex items-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 pattern-dots opacity-30" />
      
      {/* Floating decorative shapes */}
      <FloatingShape 
        variant="hexagon"
        className="absolute top-20 left-[10%] w-24 h-24 text-orange-solar/30 animate-float hidden lg:block"
      />
      <FloatingShape 
        variant="ring"
        className="absolute top-40 right-[15%] w-32 h-32 text-text-on-dark/20 animate-float-delayed hidden lg:block"
      />
      <FloatingShape 
        variant="circle"
        className="absolute bottom-20 left-[20%] w-20 h-20 text-orange-solar/20 animate-float-delayed hidden md:block"
      />
      <SunRays 
        className="absolute -right-20 top-1/2 -translate-y-1/2 w-96 h-96 text-orange-solar/20 animate-pulse-glow hidden xl:block"
      />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-solar/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-soft/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />

      <div className="container relative z-10 max-w-5xl text-center py-20">
        {/* Badge */}
        <div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8 opacity-0 animate-fade-in"
        >
          <span className="w-2 h-2 rounded-full bg-orange-solar animate-pulse" />
          <span className="text-sm font-medium text-text-on-dark/90">
            Outils & Ressources Énergétiques
          </span>
        </div>

        <h1 
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] mb-8 text-text-on-dark opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.15s" }}
        >
          Des <span className="text-gradient-orange">Outils</span> pour Décider,
          <br className="hidden sm:block" />
          des <span className="text-gradient-orange">Ressources</span> pour Comprendre
        </h1>
        
        <p 
          className="text-lg sm:text-xl lg:text-2xl text-text-on-dark/80 leading-relaxed max-w-3xl mx-auto opacity-0 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          Prenez le contrôle de votre stratégie énergétique. Nos simulateurs vous donnent 
          les chiffres, et nos guides vous donnent les clés pour les interpréter et agir.
        </p>

        {/* Scroll indicator */}
        <div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="flex flex-col items-center gap-2 text-text-on-dark/60">
            <span className="text-xs uppercase tracking-widest">Explorer</span>
            <div className="w-6 h-10 rounded-full border-2 border-current flex justify-center pt-2">
              <div className="w-1 h-2 rounded-full bg-current animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageHeader;
