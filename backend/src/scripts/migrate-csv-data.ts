/**
 * Script de migration des données CSV vers la nouvelle architecture de base de données
 * Usage: npx tsx src/scripts/migrate-csv-data.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

interface EditeurCSV {
  idEditeur: string;
  libelleEditeur: string;
  exposant: string;
  distributeur: string;
  logoEditeur: string;
}

interface JeuCSV {
  idJeu: string;
  libelleJeu: string;
  auteurJeu: string;
  nbMinJoueurJeu: string;
  nbMaxJoueurJeu: string;
  noticeJeu: string;
  idEditeur: string;
  idTypeJeu: string;
  agemini: string;
  prototype: string;
  duree: string;
  theme: string;
  description: string;
  imageJeu: string;
  videoRegle: string;
}

/**
 * Parse une ligne CSV en tenant compte des guillemets et des virgules à l'intérieur
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Lit et parse un fichier CSV
 */
async function readCSV<T>(filePath: string, headerMap: string[]): Promise<T[]> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const data: T[] = [];
  let isFirstLine = true;

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue; // Skip header
    }

    if (!line.trim()) continue;

    const values = parseCSVLine(line);
    const record: any = {};

    headerMap.forEach((header, index) => {
      record[header] = values[index] || '';
    });

    data.push(record);
  }

  return data;
}

/**
 * Convertit une valeur en nombre ou null
 */
function toNumber(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

/**
 * Convertit une valeur en booléen
 */
function toBoolean(value: string): boolean {
  return value === '1' || value.toLowerCase() === 'true';
}

/**
 * Nettoie une URL en supprimant les espaces et validant le format
 */
function cleanUrl(value: string): string | null {
  if (!value || value.trim() === '') return null;
  const cleaned = value.trim();
  // Vérifie si l'URL commence par http:// ou https://
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }
  return null;
}

/**
 * Importe les éditeurs depuis le CSV
 */
async function migrateEditeurs(): Promise<void> {
  console.log('📚 Début de la migration des éditeurs...');
  
  const csvPath = path.join(__dirname, '../../prisma/data/editeur.csv');
  const headers = ['idEditeur', 'libelleEditeur', 'exposant', 'distributeur', 'logoEditeur'];
  
  const editeurs = await readCSV<EditeurCSV>(csvPath, headers);
  console.log(`   Trouvé ${editeurs.length} éditeurs dans le CSV`);

  let imported = 0;
  let skipped = 0;

  for (const editeur of editeurs) {
    const id = toNumber(editeur.idEditeur);
    
    if (!id || !editeur.libelleEditeur) {
      skipped++;
      continue;
    }

    try {
      await prisma.editeur.upsert({
        where: { id },
        update: {
          libelle: editeur.libelleEditeur,
          exposeJeux: toBoolean(editeur.exposant),
          estDistributeur: toBoolean(editeur.distributeur),
          logoEditeur: cleanUrl(editeur.logoEditeur),
        },
        create: {
          id,
          libelle: editeur.libelleEditeur,
          exposeJeux: toBoolean(editeur.exposant),
          estDistributeur: toBoolean(editeur.distributeur),
          logoEditeur: cleanUrl(editeur.logoEditeur),
        },
      });
      imported++;
    } catch (error) {
      console.error(`   ❌ Erreur pour l'éditeur ${id}: ${error}`);
      skipped++;
    }
  }

  console.log(`✅ Migration des éditeurs terminée: ${imported} importés, ${skipped} ignorés\n`);
}

/**
 * Importe les jeux depuis le CSV
 */
async function migrateJeux(): Promise<void> {
  console.log('🎲 Début de la migration des jeux...');
  
  const csvPath = path.join(__dirname, '../../prisma/data/jeu.csv');
  const headers = [
    'idJeu', 'libelleJeu', 'auteurJeu', 'nbMinJoueurJeu', 'nbMaxJoueurJeu',
    'noticeJeu', 'idEditeur', 'idTypeJeu', 'agemini', 'prototype', 'duree',
    'theme', 'description', 'imageJeu', 'videoRegle'
  ];
  
  const jeux = await readCSV<JeuCSV>(csvPath, headers);
  console.log(`   Trouvé ${jeux.length} jeux dans le CSV`);

  let imported = 0;
  let skipped = 0;

  for (const jeu of jeux) {
    const id = toNumber(jeu.idJeu);
    const idEditeur = toNumber(jeu.idEditeur);
    
    if (!id || !idEditeur || !jeu.libelleJeu) {
      skipped++;
      continue;
    }

    // Vérifie que l'éditeur existe
    const editeurExists = await prisma.editeur.findUnique({
      where: { id: idEditeur },
    });

    if (!editeurExists) {
      console.warn(`   ⚠️  Éditeur ${idEditeur} introuvable pour le jeu ${id} (${jeu.libelleJeu})`);
      skipped++;
      continue;
    }

    try {
      await prisma.jeu.upsert({
        where: { id },
        update: {
          idEditeur,
          libelle: jeu.libelleJeu,
          auteur: jeu.auteurJeu || null,
          nbMinJoueurs: toNumber(jeu.nbMinJoueurJeu),
          nbMaxJoueurs: toNumber(jeu.nbMaxJoueurJeu),
          ageMinimum: toNumber(jeu.agemini),
          duree: toNumber(jeu.duree),
          theme: jeu.theme || null,
          description: jeu.description || null,
          notice: cleanUrl(jeu.noticeJeu),
          imageJeu: cleanUrl(jeu.imageJeu),
          videoRegle: cleanUrl(jeu.videoRegle),
          estPrototype: toBoolean(jeu.prototype),
        },
        create: {
          id,
          idEditeur,
          libelle: jeu.libelleJeu,
          auteur: jeu.auteurJeu || null,
          nbMinJoueurs: toNumber(jeu.nbMinJoueurJeu),
          nbMaxJoueurs: toNumber(jeu.nbMaxJoueurJeu),
          ageMinimum: toNumber(jeu.agemini),
          duree: toNumber(jeu.duree),
          theme: jeu.theme || null,
          description: jeu.description || null,
          notice: cleanUrl(jeu.noticeJeu),
          imageJeu: cleanUrl(jeu.imageJeu),
          videoRegle: cleanUrl(jeu.videoRegle),
          estPrototype: toBoolean(jeu.prototype),
        },
      });
      imported++;
    } catch (error) {
      console.error(`   ❌ Erreur pour le jeu ${id}: ${error}`);
      skipped++;
    }
  }

  console.log(`✅ Migration des jeux terminée: ${imported} importés, ${skipped} ignorés\n`);
}

/**
 * Fonction principale de migration
 */
async function main() {
  try {
    console.log('🚀 Démarrage de la migration des données CSV\n');
    console.log('=' .repeat(60));
    console.log('\n');

    // Migration des éditeurs en premier (dépendance pour les jeux)
    await migrateEditeurs();
    
    // Migration des jeux
    await migrateJeux();

    console.log('=' .repeat(60));
    console.log('\n🎉 Migration terminée avec succès!\n');
  } catch (error) {
    console.error('💥 Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du script
main();
