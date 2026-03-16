import { ClasseTarifaireCreateDto, ClasseTarifaireUpdateDto } from '../../../core/models/classe-tarifaire.model';
import { Festival, FestivalCreateDto, FestivalUpdateDto } from '../../../core/models/festival.model';
import { ClasseTarifaireForm, FestivalFormValue } from './festival-form.types';

export const MIN_FESTIVAL_NAME_LENGTH = 3;
export const MIN_CLASSE_NAME_LENGTH = 2;
export const PERSISTED_CLASSE_REQUIRED_MESSAGE =
  'Un festival existant doit conserver au moins une classe tarifaire enregistrée.';

interface ClasseTarifaireSubmitValidationInput {
  classesCount: number;
  isEditMode: boolean;
  initialPersistedCount: number;
  persistedCount: number;
}

export function mapFestivalToFormValue(festival: Festival): { nom: string; nombre_tables: number; date: Date } {
  return {
    nom: festival.nom,
    nombre_tables: festival.nbTotalTables,
    date: new Date(festival.date)
  };
}

export function mapClasseTarifaireToFormValue(classe: {
  id?: number;
  libelle: string;
  prixTable: number;
  nbTotalTables: number;
}): ClasseTarifaireForm {
  return {
    id: classe.id,
    libelle: classe.libelle,
    prixTable: fromCents(classe.prixTable),
    nbTotalTables: classe.nbTotalTables
  };
}

export function buildFestivalUpdateDto(formValue: FestivalFormValue): FestivalUpdateDto {
  return {
    nom: formValue.nom,
    nbTotalTables: formValue.nombre_tables,
    date: toIsoDate(formValue.date)
  };
}

export function buildFestivalCreateDto(formValue: FestivalFormValue): FestivalCreateDto {
  return {
    nom: formValue.nom,
    nbTotalTables: formValue.nombre_tables,
    date: toIsoDate(formValue.date),
    classesTarifaires: formValue.classesTarifaires.map((classe) => ({
      libelle: classe.libelle,
      prixTable: toCents(classe.prixTable),
      nbTotalTables: classe.nbTotalTables
    }))
  };
}

export function buildClasseTarifaireUpdateDto(classe: ClasseTarifaireForm): ClasseTarifaireUpdateDto {
  return {
    libelle: classe.libelle,
    prixTable: toCents(classe.prixTable),
    nbTotalTables: classe.nbTotalTables
  };
}

export function buildClasseTarifaireCreateDto(
  festivalId: number,
  classe: ClasseTarifaireForm
): ClasseTarifaireCreateDto {
  return {
    idFestival: festivalId,
    libelle: classe.libelle,
    prixTable: toCents(classe.prixTable),
    nbTotalTables: classe.nbTotalTables
  };
}

export function hasUniqueClasseNames(classes: ClasseTarifaireForm[]): boolean {
  const names = classes.map((classe) => classe.libelle.trim().toLowerCase());
  return new Set(names).size === names.length;
}

export function validateClassesTarifairesBeforeSubmit(
  input: ClasseTarifaireSubmitValidationInput
): string | null {
  if (input.classesCount === 0) {
    return 'Au moins une classe tarifaire est requise.';
  }

  if (input.isEditMode && input.initialPersistedCount > 0 && input.persistedCount === 0) {
    return PERSISTED_CLASSE_REQUIRED_MESSAGE;
  }

  return null;
}

export function extractApiErrorMessage(err: unknown): string {
  const error = err as {
    error?: { error?: string; message?: string };
    message?: string;
  };

  return error?.error?.error || error?.error?.message || error?.message || 'Erreur inconnue';
}

function toIsoDate(date: Date | string): string {
  return date instanceof Date ? date.toISOString() : date;
}

function toCents(value: number): number {
  return Math.round(value * 100);
}

function fromCents(value: number): number {
  return value / 100;
}
