import { SelectOption } from '../../../shared/components/ui-select/ui-select.component';
import { AuditEnergetiqueResponse } from '../../../core/services/audit-energetique.service';

export interface StepField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'select-icon' | 'box' | 'box-icon';
  placeholder?: string;
  required?: boolean;
  options?: SelectOption[] | string[];
  icon?: string;
  iconPosition?: 'left' | 'top';
  tooltipTitle?: string;
  tooltipDescription?: string;
  tooltipOptions?: string[];
  min?: number;
  max?: number;
  condition?: (form: any) => boolean;
  shortInput?: boolean; // If true, group with next short input on same row
  useDropdown?: boolean; // If true, force dropdown instead of boxes for long text
}

export interface SimulatorStep {
  number: number;
  title: string;
  description?: string;
  fields: StepField[];
  isResult?: boolean;
  component?: string; // Component name for dynamic loading
}

export interface EnergyAuditFormValue {
  // Step 1: Building Profile
  buildingType?: string;
  surfaceArea?: number;
  floors?: number;
  activityType?: string;
  climateZone?: string;
  
  // Step 2: Technical/Equipment
  openingDaysPerWeek?: number;
  openingHoursPerDay?: number;
  insulation?: string;
  glazingType?: string;
  heatingSystem?: string;
  coolingSystem?: string;
  domesticHotWater?: string;
  ventilation?: string;
  lightingType?: string;
  conditionedCoverage?: string;
  equipmentCategories?: string[];
  hasExistingMeasures?: boolean;
  existingMeasures?: string[];
  
  // Step 3: Personal & Consumption
  fullName?: string;
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  governorate?: string;
  monthlyBillAmount?: number;
  tariffType?: string;
  referenceMonth?: string; // Month number as string (1-12)
}

export interface EnergyAuditRequest {
  // Personal
  fullName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  address: string;
  governorate: string;
  
  // Building
  buildingType: string;
  surfaceArea: number;
  floors: number;
  activityType: string;
  climateZone: string;
  
  // Technical
  openingDaysPerWeek: number;
  openingHoursPerDay: number;
  insulation: string;
  glazingType: string;
  ventilation: string;
  heatingSystem: string;
  coolingSystem: string;
  conditionedCoverage: string;
  domesticHotWater: string;
  equipmentCategories?: string[];
  existingMeasures?: string[];
  lightingType: string;
  
  // Consumption
  tariffType: string;
  // COMMENTED OUT: contractedPower field removed from UI
  // contractedPower?: number;
  contractedPower?: number; // Keep in interface for API compatibility, but always send undefined
  monthlyBillAmount: number;
  hasRecentBill: boolean;
  // COMMENTED OUT: recentBillConsumption field removed from UI
  // recentBillConsumption?: number;
  recentBillConsumption?: number; // Keep in interface for API compatibility, but always send undefined
  billAttachmentUrl?: string;
  // COMMENTED OUT: referenceMonth not sent to backend yet
  // referenceMonth?: string;
}

// Use the same response type as audit-energetique for consistency
export type EnergyAuditResponse = AuditEnergetiqueResponse;
