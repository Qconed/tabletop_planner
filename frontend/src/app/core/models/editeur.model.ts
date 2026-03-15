export interface Editeur {
  id: number;
  libelle: string;
  exposeJeux: boolean;
  logo?: string | null;
  _count?: {
    jeux: number;
    reservations: number;
  };
}
