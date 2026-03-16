export interface ClasseTarifaireForm {
  id?: number;
  libelle: string;
  prixTable: number;
  nbTotalTables: number;
}

export interface FestivalFormValue {
  nom: string;
  nombre_tables: number;
  date: Date | string;
  classesTarifaires: ClasseTarifaireForm[];
}
