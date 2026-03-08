/*
  Warnings:

  - You are about to drop the column `est_distributeur` on the `editeurs` table. All the data in the column will be lost.
  - You are about to drop the column `age_minimum` on the `jeux` table. All the data in the column will be lost.
  - You are about to drop the column `duree` on the `jeux` table. All the data in the column will be lost.
  - You are about to drop the column `est_prototype` on the `jeux` table. All the data in the column will be lost.
  - You are about to drop the column `nb_max_joueurs` on the `jeux` table. All the data in the column will be lost.
  - You are about to drop the column `nb_min_joueurs` on the `jeux` table. All the data in the column will be lost.
  - You are about to drop the column `notice` on the `jeux` table. All the data in the column will be lost.
  - You are about to drop the column `theme` on the `jeux` table. All the data in the column will be lost.
  - You are about to drop the column `video_regle` on the `jeux` table. All the data in the column will be lost.
  - You are about to drop the column `viendra_presenter` on the `reservations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "editeurs" DROP COLUMN "est_distributeur";

-- AlterTable
ALTER TABLE "jeux" DROP COLUMN "age_minimum",
DROP COLUMN "duree",
DROP COLUMN "est_prototype",
DROP COLUMN "nb_max_joueurs",
DROP COLUMN "nb_min_joueurs",
DROP COLUMN "notice",
DROP COLUMN "theme",
DROP COLUMN "video_regle";

-- AlterTable
ALTER TABLE "reservations" DROP COLUMN "viendra_presenter";
