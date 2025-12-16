import { auditPDFService } from "./modules/audit-energetique/pdf.service";
import { toAuditEnergetiqueResponseDto } from "./modules/audit-energetique/dto/audit-energetique-response.dto";

import {
  Governorates,
  BuildingTypes,
  ClimateZones,
  InsulationQualities,
  GlazingTypes,
  VentilationSystems,
} from "@shared";

async function run() {
  // -------------------------------------------------------------------
  // Simulated DB entity (matches IAuditEnergetiqueSimulation)
  // -------------------------------------------------------------------
  const simulation = {
    id: "test-id",

    // ---------------- CONTACT ----------------
    firstName: "Fedi",
    lastName: "Ben Ali",
    companyName: "Pharmacie Centrale",
    email: "hello@joya-energy.com",
    phoneNumber: "20123456",
    address: "123 Avenue Habib Bourguiba",
    governorate: Governorates.TUNIS,

    // ---------------- BUILDING ----------------
    buildingType: BuildingTypes.PHARMACY,
    surfaceArea: 146.44,
    floors: 1,
    activityType: "Pharmacie",
    openingHoursPerDay: 8,
    openingDaysPerWeek: 6,

    // ---------------- ENVELOPE ----------------
    insulation: InsulationQualities.MEDIUM,
    glazingType: GlazingTypes.DOUBLE,
    ventilation: VentilationSystems.SINGLE_FLOW,
    climateZone: ClimateZones.NORTH,

    // ---------------- SYSTEMS ----------------
    heatingSystem: "Chauffage électrique",
    coolingSystem: "NONE",
    conditionedCoverage: "PARTIAL",
    domesticHotWater: "ELECTRIC",
    equipmentCategories: [],
    lightingType: "LED",

    // ---------------- BILLING ----------------
    tariffType: "BT",
    contractedPower: 0,
    monthlyBillAmount: 0,
    hasRecentBill: false,
    recentBillConsumption: 0,
    billAttachmentUrl: "",

    // ---------------- MEASURES ----------------
    existingMeasures: [],

    // ---------------- RESULTS ----------------
    annualConsumption: 14669.17,
    monthlyConsumption: 1222.43,
    energyCostPerYear: 5134.21,

    co2EmissionsKg: 7510.62,
    co2EmissionsTons: 7.511,

    energyClass: "C",
    becth: 2.5,
    energyClassDescription: "Performance énergétique moyenne",

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // -------------------------------------------------------------------
  // DB → DTO
  // -------------------------------------------------------------------
  const dto = toAuditEnergetiqueResponseDto(simulation as any);

  // -------------------------------------------------------------------
  // DTO → PDF
  // -------------------------------------------------------------------
  const pdf = await auditPDFService.generatePDF(dto);

  console.log("✅ PDF generated successfully");
  console.log("📄 Size:", pdf.length, "bytes");
}

run().catch(console.error);
