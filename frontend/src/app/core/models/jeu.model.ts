import { Editeur } from './editeur.model';

export interface Jeu {
  id: number;
  idEditeur: number;
  libelle: string;
  auteur?: string;
  description?: string;
  imageJeu?: string;
  createdAt: string;
  updatedAt: string;
  editeur?: Partial<Editeur>;
}
