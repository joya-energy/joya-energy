/**
 * Recommendation Service
 * 
 * Generates energy efficiency recommendations based on building type.
 * Separated from PDF service to maintain single responsibility.
 */

type BuildingCategory =
  | 'Catégorie1'
  | 'Catégorie2'
  | 'Catégorie3'
  | 'Catégorie4'
  | 'Inconnue';

/**
 * Determine building category based on building type
 */
function getBuildingCategory(buildingType: string): BuildingCategory {
  const Catégorie1 = [
    'Pharmacie',
    'Café',
    'Restaurant',
    'Centre esthétique',
    'Spa',
    'Hôtel',
    'Maison d\'hôtes',
    'Clinique',
    'Centre médical',
    'Bureau',
    'Administration',
    'Banque',
    'École',
    'Centre de formation'
  ];

  const Catégorie2 = [
    'Atelier léger',
    'Artisanat',
    'Menuiserie',
    'Industrie textile',
    'Emballage'
  ];

  const Catégorie3 = [
    'Usine lourde / Mécanique / Métallurgie',
    'Industrie plastique /Injection'
  ];

  const Catégorie4 = [
    'Industrie alimentaire',
    'Industrie agroalimentaire réfrigérée'
  ];

  if (Catégorie1.includes(buildingType)) return 'Catégorie1';
  if (Catégorie2.includes(buildingType)) return 'Catégorie2';
  if (Catégorie3.includes(buildingType)) return 'Catégorie3';
  if (Catégorie4.includes(buildingType)) return 'Catégorie4';

  return 'Catégorie1';
}

/**
 * Generate HTML table with energy efficiency recommendations
 * based on building category
 */
export function getRecommendationsHTML(buildingType: string): string {
  const category = getBuildingCategory(buildingType);

  const tableHeader = `
    <table class="reco-table">
      <thead>
        <tr>
          <th>Action recommandée</th>
          <th>Poste concerné</th>
          <th>Gain potentiel estimé</th>
        </tr>
      </thead>
      <tbody>
  `;

  const tableFooter = `
      </tbody>
    </table>
  `;

  switch (category) {
    case 'Catégorie1':
      return `
        ${tableHeader}
        <tr>
          <td>Optimisation de la climatisation (HVAC)</td>
          <td>Climatisation</td>
          <td>–10 % à –20 %</td>
        </tr>
        <tr>
          <td>Éclairage LED et gestion automatisée</td>
          <td>Éclairage</td>
          <td>–10 % à –25 %</td>
        </tr>
        <tr>
          <td>Gestion des horaires d'occupation</td>
          <td>Usage global</td>
          <td>–5 % à –15 %</td>
        </tr>
        <tr>
          <td>Optimisation de la production d'ECS</td>
          <td>Eau chaude sanitaire</td>
          <td>–5 % à –20 %</td>
        </tr>
        <tr>
          <td>Maintenance énergétique préventive</td>
          <td>Systèmes énergétiques</td>
          <td>–5 % à –10 %</td>
        </tr>
        ${tableFooter}
      `;

    case 'Catégorie2':
      return `
        ${tableHeader}
        <tr>
          <td>Éclairage industriel LED</td>
          <td>Éclairage</td>
          <td>–10 % à –20 %</td>
        </tr>
        <tr>
          <td>Variateurs de vitesse sur moteurs / ventilateurs</td>
          <td>Moteurs / Ventilation</td>
          <td>–10 % à –25 %</td>
        </tr>
        <tr>
          <td>Optimisation des compresseurs d'air</td>
          <td>Air comprimé</td>
          <td>–10 % à –20 %</td>
        </tr>
        <tr>
          <td>Réduction des fuites d'air comprimé</td>
          <td>Air comprimé</td>
          <td>–10 % à –30 %</td>
        </tr>
        <tr>
          <td>Optimisation des cycles de production</td>
          <td>Process</td>
          <td>–5 % à –15 %</td>
        </tr>
        ${tableFooter}
      `;

    case 'Catégorie3':
      return `
        ${tableHeader}
        <tr>
          <td>Optimisation des moteurs et équipements process</td>
          <td>Process industriel</td>
          <td>–10 % à –20 %</td>
        </tr>
        <tr>
          <td>Variateurs sur compresseurs et pompes</td>
          <td>Pompage / Compression</td>
          <td>–10 % à –25 %</td>
        </tr>
        <tr>
          <td>Optimisation des systèmes pneumatiques</td>
          <td>Systèmes pneumatiques</td>
          <td>–10 % à –30 %</td>
        </tr>
        <tr>
          <td>Modernisation de l'éclairage industriel</td>
          <td>Éclairage</td>
          <td>–10 % à –15 %</td>
        </tr>
        <tr>
          <td>Monitoring énergétique industriel</td>
          <td>Suivi énergétique</td>
          <td>–10 % à –20 %</td>
        </tr>
        ${tableFooter}
      `;

    case 'Catégorie4':
      return `
        ${tableHeader}
        <tr>
          <td>Optimisation des chambres froides (isolation / étanchéité)</td>
          <td>Froid</td>
          <td>–10 % à –25 %</td>
        </tr>
        <tr>
          <td>Amélioration du rendement des groupes froid</td>
          <td>Production de froid</td>
          <td>–15 % à –35 %</td>
        </tr>
        <tr>
          <td>Variateurs sur compresseurs et ventilateurs</td>
          <td>Ventilation / Froid</td>
          <td>–10 % à –25 %</td>
        </tr>
        <tr>
          <td>Maintenance préventive du système de froid</td>
          <td>Systèmes frigorifiques</td>
          <td>–5 % à –15 %</td>
        </tr>
        <tr>
          <td>Optimisation de l'éclairage en zone froide</td>
          <td>Éclairage</td>
          <td>–5 % à –10 %</td>
        </tr>
        ${tableFooter}
      `;

    default:
      return `
        ${tableHeader}
        <tr>
          <td>Audit énergétique approfondi requis</td>
          <td>Global</td>
          <td>À définir</td>
        </tr>
        <tr>
          <td>Analyse spécifique du type de bâtiment</td>
          <td>Global</td>
          <td>À définir</td>
        </tr>
        ${tableFooter}
      `;
  }
}

