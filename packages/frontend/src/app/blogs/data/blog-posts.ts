export interface BlogAuthor {
  name: string;
  role: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  /** Full article body (optional). Use \n\n between paragraphs. */
  content?: string;
  imageUrl: string;
  date: string;
  category: string;
  author?: BlogAuthor;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: "Guide complet : passer au solaire sans investissement initial",
    excerpt:
      "Découvrez comment le modèle ESCO de JOYA Energy permet aux entreprises tunisiennes de s'équiper en panneaux solaires sans mise de fonds. Financement, économies et impact carbone expliqués.",
    imageUrl: '/blog1.png',
    date: '02 Feb 2026',
    category: 'Énergie solaire',
    content: `Pourquoi le photovoltaïque est devenu un levier majeur d'économies pour les entreprises

Pendant longtemps, le solaire était perçu comme un choix écologique.
Aujourd'hui, il est devenu un choix économique.
Dans un contexte de hausse des tarifs électriques, d'incertitude énergétique et de pression sur les marges, produire sa propre énergie n'est plus un luxe — c'est une stratégie.

L'électricité : un poste de coût sous-estimé

Pour de nombreuses PME et industries, la facture d'électricité représente un poste de charge important et surtout imprévisible.
Chaque augmentation tarifaire impacte directement :
La rentabilité
Les prix de vente
La compétitivité
Installer du photovoltaïque permet de reprendre le contrôle.

Produire, c'est économiser

Une installation photovoltaïque bien dimensionnée permet de couvrir une partie significative de la consommation électrique.
Concrètement :
Chaque kWh produit est un kWh non acheté au réseau
Les coûts deviennent stables sur 20 à 25 ans
Les économies sont visibles dès la mise en service
Selon le profil de consommation, une entreprise peut réduire sa facture de 30 % à 60 %.
Ce n'est pas seulement une économie annuelle.
C'est une sécurisation à long terme.

Un investissement qui travaille pour vous

Contrairement à une dépense classique, le solaire crée un actif.
L'installation :
Génère des économies récurrentes
Améliore la valeur de l'entreprise
Renforce le positionnement ESG
Réduit l'empreinte carbone
Le retour sur investissement est souvent compris entre 4 et 7 ans selon le modèle choisi.
Le solaire n'est plus une tendance. C'est une logique financière.
Les entreprises qui investissent dans le photovoltaïque ne le font plus uniquement pour l'environnement.
Elles le font pour :
Stabiliser leurs charges
Protéger leurs marges
Anticiper les évolutions réglementaires
Renforcer leur crédibilité auprès des partenaires et investisseurs`,
  },
];

export function getBlogPostById(id: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.id === id);
}

export function getRelatedPosts(excludeId: string, limit = 3): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.id !== excludeId).slice(0, limit);
}
