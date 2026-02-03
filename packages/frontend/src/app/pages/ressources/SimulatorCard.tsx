import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface SimulatorCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: { bold: string; text: string }[];
  buttonText: string;
  index: number;
  accentColor?: "orange" | "teal";
}

const SimulatorCard: React.FC<SimulatorCardProps> = ({
  icon,
  title,
  description,
  features,
  buttonText,
  index,
  accentColor = "orange",
}) => {
  return (
    <div
      className="group relative gradient-card rounded-2xl p-8 lg:p-10 card-hover flex flex-col h-full opacity-0 animate-fade-in-up overflow-hidden"
      style={{ animationDelay: `${0.1 + index * 0.1}s` }}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl border border-border group-hover:border-orange-solar/30 transition-colors duration-300" />
      
      {/* Hover glow */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-orange-solar/5 via-transparent to-teal-soft/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Icon with animated background */}
        <div className="relative mb-6">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
            accentColor === "orange" 
              ? "bg-orange-solar/10 text-orange-solar" 
              : "bg-teal-soft/10 text-teal-soft"
          } group-hover:scale-110 transition-transform duration-300`}>
            <div className="w-9 h-9">{icon}</div>
          </div>
          {/* Decorative dot */}
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
            accentColor === "orange" ? "bg-orange-solar" : "bg-teal-soft"
          } opacity-60`} />
        </div>
        
        <h3 className="text-xl lg:text-2xl font-heading font-bold mb-4 group-hover:text-teal-soft transition-colors duration-300">
          {title}
        </h3>
        
        <p className="text-text-body/80 leading-relaxed mb-6">{description}</p>
        
        <ul className="space-y-3 mb-8 flex-grow">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                accentColor === "orange" 
                  ? "bg-orange-solar/10 text-orange-solar" 
                  : "bg-teal-soft/10 text-teal-soft"
              }`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-text-body">
                <strong className="font-semibold text-teal-deep">{feature.bold}</strong> {feature.text}
              </span>
            </li>
          ))}
        </ul>
        
        <Button className="w-full group/btn mt-auto">
          {buttonText}
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};

export default SimulatorCard;
