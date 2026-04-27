export interface AvailabilitySlot {
  label: string;
  from: string; // "HH:MM"
  to: string;   // "HH:MM"
}

export interface AvailabilitySchedule {
  enabled: boolean;
  slots: AvailabilitySlot[];
}
