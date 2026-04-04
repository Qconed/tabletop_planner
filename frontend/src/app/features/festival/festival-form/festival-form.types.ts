export interface ClasseTarifaireForm {
  id?: number;
  libelle: string;
  prixTable: number;
  nbTotalTables: number;
}

export interface FestivalFormValue {
  nom: string;
  date: Date | string;
  classesTarifaires: ClasseTarifaireForm[];
}
