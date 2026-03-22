import { ClasseTarifaire } from './classe-tarifaire.model';
import { Festival } from './festival.model';

export type StatutWorkflow =
  | 'PAS_DE_CONTACT'
  | 'CONTACT_PRIS'
  | 'DISCUSSION_EN_COURS'
  | 'SERA_ABSENT'
  | 'CONSIDERE_ABSENT'
  | 'PRESENT'
  | 'FACTURE'
  | 'FACTURE_PAYEE';

export interface ReservationClasse {
  id: number;
  idClasseTarifaire: number;
  idReservation: number;
  nbTables: number;
  createdAt?: Date;
  updatedAt?: Date;
  classeTarifaire?: ClasseTarifaire;
}

export interface Reservation {
  id: number;
  idEditeur: number;
  idFestival: number;
  notesResa?: string | null;
  nbTablesResa: number;
  statut: StatutWorkflow;
  createdAt?: Date;
  updatedAt?: Date;
  editeur?: {
    id: number;
    libelle: string;
    logoEditeur?: string | null;
    logo?: string | null;
  };
  festival?: Pick<Festival, 'id' | 'nom' | 'date'>;
  reservationClasses?: ReservationClasse[];
  _count?: {
    jeuxReservations: number;
    reservationClasses: number;
    placementsJeux: number;
  };
}

export interface ReservationCreateClasseDto {
  idClasseTarifaire: number;
  nbTables: number;
}

export interface ReservationCreateDto {
  idEditeur: number;
  idFestival: number;
  notesResa?: string;
  nbTablesResa: number;
  statut?: StatutWorkflow;
  reservationClasses?: ReservationCreateClasseDto[];
}

export interface ReservationUpdateDto {
  idEditeur?: number;
  idFestival?: number;
  notesResa?: string;
  nbTablesResa?: number;
  statut?: StatutWorkflow;
}
