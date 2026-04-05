import { Jeu } from './jeu.model';

export interface JeuReservation {
  idReservation: number;
  idJeu: number;
  quantite: number;
  createdAt?: Date;
  jeu?: Jeu;
}

export interface CreateJeuReservationDto {
  idReservation: number;
  idJeu: number;
  quantite?: number;
}

export interface UpdateJeuReservationDto {
  quantite: number;
}
