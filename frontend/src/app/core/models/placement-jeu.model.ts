import { ClasseTarifaire } from './classe-tarifaire.model';
import { JeuReservation } from './jeu-reservation.model';

export interface PlacementJeu {
  id: number;
  idReservation: number;
  idClasseTarifaire: number;
  idJeu: number;
  nbTables: number;
  quantiteJeu: number;
  createdAt?: Date;
  updatedAt?: Date;
  classeTarifaire?: ClasseTarifaire;
  jeuReservation?: JeuReservation;
}

export interface CreatePlacementJeuDto {
  idReservation: number;
  idClasseTarifaire: number;
  idJeu: number;
  nbTables: number;
  quantiteJeu: number;
}

export interface UpdatePlacementJeuDto {
  idClasseTarifaire?: number;
  nbTables?: number;
  quantiteJeu?: number;
}
