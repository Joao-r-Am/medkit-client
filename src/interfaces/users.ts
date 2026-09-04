export enum AccessType {
  ROOT = 0,
  ADMIN = 1,
  BASIC = 2,
  USER = 3
}

export enum EspecialtyArea {
  PSYCHOLOGIST = "psychologist",
  SPEECH_THERAPIST = "speech_therapist",
  NUTRITIONIST = "nutritionist",
  PHYSIOTHERAPIST = "physiotherapist",
  DENTIST = "dentist",
  PHARMACIST = "pharmacist",
  NURSE = "nurse",
  OCCUPATIONAL_THERAPIST = "occupational_therapist",
  CLINIC = "clinic"
}

export const AccessTypeList = [
  { name: "Root", value: AccessType.ROOT },
  { name: "Admin", value: AccessType.ADMIN },
  { name: "Básico", value: AccessType.BASIC },
  { name: "Usuário", value: AccessType.USER }
];

export const EspecialtyAreaList = [
  { name: "Psicólogo", value: EspecialtyArea.PSYCHOLOGIST },
  { name: "Fonoaudiólogo", value: EspecialtyArea.SPEECH_THERAPIST },
  { name: "Nutricionista", value: EspecialtyArea.NUTRITIONIST },
  { name: "Fisioterapeuta", value: EspecialtyArea.PHYSIOTHERAPIST },
  { name: "Dentista", value: EspecialtyArea.DENTIST },
  { name: "Farmacêutico", value: EspecialtyArea.PHARMACIST },
  { name: "Enfermeiro", value: EspecialtyArea.NURSE },
  {
    name: "Terapeuta Ocupacional",
    value: EspecialtyArea.OCCUPATIONAL_THERAPIST
  },
  { name: "Clínica", value: EspecialtyArea.CLINIC }
];
