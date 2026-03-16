export interface ClasseTarifaire {
  id: number;
  idFestival: number;
  libelle: string;
  prixTable: number;
  nbTotalTables: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClasseTarifaireCreateDto {
  idFestival: number;
  libelle: string;
  prixTable: number;
  nbTotalTables: number;
}

export interface ClasseTarifaireUpdateDto {
  libelle?: string;
  prixTable?: number;
  nbTotalTables?: number;
}
