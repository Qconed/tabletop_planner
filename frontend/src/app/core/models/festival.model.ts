export interface Festival {
  id: number;
  nom: string;
  date: Date | string;
  nbTotalTables: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FestivalCreateDto {
  nom: string;
  date: Date | string;
  nbTotalTables: number;
}

export interface FestivalUpdateDto {
  nom?: string;
  date?: Date | string;
  nbTotalTables?: number;
}
