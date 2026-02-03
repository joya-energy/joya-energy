import React from "react";
import { ArrowRight } from "lucide-react";

interface KnowledgeCardProps {
  icon: React.ReactNode;
  badge: string;
  title: string;
  description: string;
  linkText: string;
  href: string;
  index: number;
}

const KnowledgeCard: React.FC<KnowledgeCardProps> = ({
  icon,
  badge,
  title,
  description,
  linkText,
  href,
  index,
}) => {
  return (
    <a
      href={href}
      className="group relative gradient-card rounded-2xl p-6 lg:p-8 card-hover flex flex-col h-full opacity-0 animate-fade-in-up overflow-hidden cursor-pointer"
      style={{ animationDelay: `${0.1 + index * 0.1}s` }}
    >
      {/* Border */}
      <div className="absolute inset-0 rounded-2xl border border-border group-hover:border-orange-solar/30 transition-colors duration-300" />
      
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-solar/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header with icon and badge */}
        <div className="flex items-start justify-between mb-5">
          <div className="w-12 h-12 rounded-xl bg-teal-deep/5 flex items-center justify-center text-teal-deep group-hover:bg-teal-deep group-hover:text-text-on-dark transition-all duration-300">
            <div className="w-6 h-6">{icon}</div>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-orange-solar bg-orange-solar/10 px-3 py-1 rounded-full">
            {badge}
          </span>
        </div>
        
        <h4 className="text-lg lg:text-xl font-semibold leading-snug mb-4 group-hover:text-teal-soft transition-colors duration-300">
          {title}
        </h4>
        
        <p className="text-text-body/70 leading-relaxed mb-6 flex-grow">{description}</p>
        
        <div className="flex items-center gap-2 text-orange-solar font-semibold group-hover:gap-3 transition-all duration-300">
          {linkText}
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </a>
  );
};

export default KnowledgeCard;
