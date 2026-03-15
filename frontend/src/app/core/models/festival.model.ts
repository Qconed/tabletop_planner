import { ClasseTarifaire } from './classe-tarifaire.model';

export interface Festival {
  id: number;
  nom: string;
  date: Date | string;
  nbTotalTables: number;
  createdAt?: Date;
  updatedAt?: Date;
  classesTarifaires?: ClasseTarifaire[];
  _count?: {
    classesTarifaires: number;
  };
}

export interface FestivalCreateClasseTarifaireDto {
  libelle: string;
  prixTable: number;
  nbTotalTables: number;
}

export interface FestivalCreateDto {
  nom: string;
  date: Date | string;
  nbTotalTables: number;
  classesTarifaires: FestivalCreateClasseTarifaireDto[];
}

export interface FestivalUpdateDto {
  nom?: string;
  date?: Date | string;
  nbTotalTables?: number;
}
