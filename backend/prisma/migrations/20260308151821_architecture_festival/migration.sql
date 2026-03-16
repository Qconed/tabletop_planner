-- CreateEnum
CREATE TYPE "statut_workflow" AS ENUM ('pas_de_contact', 'contact_pris', 'discussion_en_cours', 'sera_absent', 'considere_absent', 'present', 'facture', 'facture_payee');

-- CreateTable
CREATE TABLE "festivals" (
    "id_festival" SERIAL NOT NULL,
    "nom" VARCHAR(255) NOT NULL,
    "nb_total_tables" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "festivals_pkey" PRIMARY KEY ("id_festival")
);

-- CreateTable
CREATE TABLE "editeurs" (
    "id_editeur" SERIAL NOT NULL,
    "libelle" VARCHAR(255) NOT NULL,
    "expose_jeux" BOOLEAN NOT NULL DEFAULT false,
    "est_distributeur" BOOLEAN NOT NULL DEFAULT false,
    "logo_editeur" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editeurs_pkey" PRIMARY KEY ("id_editeur")
);

-- CreateTable
CREATE TABLE "jeux" (
    "id_jeu" SERIAL NOT NULL,
    "id_editeur" INTEGER NOT NULL,
    "libelle" VARCHAR(255) NOT NULL,
    "auteur" VARCHAR(255),
    "nb_min_joueurs" INTEGER,
    "nb_max_joueurs" INTEGER,
    "age_minimum" INTEGER,
    "duree" INTEGER,
    "theme" VARCHAR(255),
    "description" TEXT,
    "notice" VARCHAR(500),
    "image_jeu" VARCHAR(500),
    "video_regle" VARCHAR(500),
    "est_prototype" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jeux_pkey" PRIMARY KEY ("id_jeu")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id_reservation" SERIAL NOT NULL,
    "id_editeur" INTEGER NOT NULL,
    "id_festival" INTEGER NOT NULL,
    "notes_resa" TEXT,
    "viendra_presenter" BOOLEAN NOT NULL DEFAULT false,
    "nb_tables_resa" INTEGER NOT NULL,
    "statut" "statut_workflow" NOT NULL DEFAULT 'pas_de_contact',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id_reservation")
);

-- CreateTable
CREATE TABLE "jeux_reservations" (
    "id_reservation" INTEGER NOT NULL,
    "id_jeu" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jeux_reservations_pkey" PRIMARY KEY ("id_reservation","id_jeu")
);

-- CreateTable
CREATE TABLE "classes_tarifaires" (
    "id_classe_tarifaire" SERIAL NOT NULL,
    "id_festival" INTEGER NOT NULL,
    "libelle" VARCHAR(255) NOT NULL,
    "prix_table" INTEGER NOT NULL,
    "nb_total_tables" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_tarifaires_pkey" PRIMARY KEY ("id_classe_tarifaire")
);

-- CreateTable
CREATE TABLE "reservations_classes" (
    "id_reservation_classe" SERIAL NOT NULL,
    "id_classe_tarifaire" INTEGER NOT NULL,
    "id_reservation" INTEGER NOT NULL,
    "nb_tables" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_classes_pkey" PRIMARY KEY ("id_reservation_classe")
);

-- CreateTable
CREATE TABLE "placements_jeux" (
    "id_placement_jeu" SERIAL NOT NULL,
    "id_reservation" INTEGER NOT NULL,
    "id_classe_tarifaire" INTEGER NOT NULL,
    "id_jeu_reservation" TEXT NOT NULL,
    "id_jeu" INTEGER NOT NULL,
    "nb_tables" INTEGER NOT NULL,
    "quantite_jeu" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placements_jeux_pkey" PRIMARY KEY ("id_placement_jeu")
);

-- CreateIndex
CREATE INDEX "jeux_id_editeur_idx" ON "jeux"("id_editeur");

-- CreateIndex
CREATE INDEX "reservations_id_editeur_idx" ON "reservations"("id_editeur");

-- CreateIndex
CREATE INDEX "reservations_id_festival_idx" ON "reservations"("id_festival");

-- CreateIndex
CREATE INDEX "jeux_reservations_id_reservation_idx" ON "jeux_reservations"("id_reservation");

-- CreateIndex
CREATE INDEX "jeux_reservations_id_jeu_idx" ON "jeux_reservations"("id_jeu");

-- CreateIndex
CREATE INDEX "classes_tarifaires_id_festival_idx" ON "classes_tarifaires"("id_festival");

-- CreateIndex
CREATE INDEX "reservations_classes_id_classe_tarifaire_idx" ON "reservations_classes"("id_classe_tarifaire");

-- CreateIndex
CREATE INDEX "reservations_classes_id_reservation_idx" ON "reservations_classes"("id_reservation");

-- CreateIndex
CREATE INDEX "placements_jeux_id_reservation_idx" ON "placements_jeux"("id_reservation");

-- CreateIndex
CREATE INDEX "placements_jeux_id_classe_tarifaire_idx" ON "placements_jeux"("id_classe_tarifaire");

-- CreateIndex
CREATE INDEX "placements_jeux_id_reservation_id_jeu_idx" ON "placements_jeux"("id_reservation", "id_jeu");

-- AddForeignKey
ALTER TABLE "jeux" ADD CONSTRAINT "jeux_id_editeur_fkey" FOREIGN KEY ("id_editeur") REFERENCES "editeurs"("id_editeur") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_id_editeur_fkey" FOREIGN KEY ("id_editeur") REFERENCES "editeurs"("id_editeur") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_id_festival_fkey" FOREIGN KEY ("id_festival") REFERENCES "festivals"("id_festival") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jeux_reservations" ADD CONSTRAINT "jeux_reservations_id_reservation_fkey" FOREIGN KEY ("id_reservation") REFERENCES "reservations"("id_reservation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jeux_reservations" ADD CONSTRAINT "jeux_reservations_id_jeu_fkey" FOREIGN KEY ("id_jeu") REFERENCES "jeux"("id_jeu") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes_tarifaires" ADD CONSTRAINT "classes_tarifaires_id_festival_fkey" FOREIGN KEY ("id_festival") REFERENCES "festivals"("id_festival") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations_classes" ADD CONSTRAINT "reservations_classes_id_classe_tarifaire_fkey" FOREIGN KEY ("id_classe_tarifaire") REFERENCES "classes_tarifaires"("id_classe_tarifaire") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations_classes" ADD CONSTRAINT "reservations_classes_id_reservation_fkey" FOREIGN KEY ("id_reservation") REFERENCES "reservations"("id_reservation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements_jeux" ADD CONSTRAINT "placements_jeux_id_reservation_fkey" FOREIGN KEY ("id_reservation") REFERENCES "reservations"("id_reservation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements_jeux" ADD CONSTRAINT "placements_jeux_id_classe_tarifaire_fkey" FOREIGN KEY ("id_classe_tarifaire") REFERENCES "classes_tarifaires"("id_classe_tarifaire") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements_jeux" ADD CONSTRAINT "placements_jeux_id_reservation_id_jeu_fkey" FOREIGN KEY ("id_reservation", "id_jeu") REFERENCES "jeux_reservations"("id_reservation", "id_jeu") ON DELETE CASCADE ON UPDATE CASCADE;
