import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FestivalFormComponent } from './festival-form/festival-form.component';
import { FestivalListComponent } from './festival-list/festival-list.component';
import { FestivalService } from '../../core/services/festival.service';
import { Festival } from '../../core/models/festival.model';

@Component({
  selector: 'app-festival-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FestivalListComponent
  ],
  templateUrl: './festival-manager.component.html',
  styleUrls: ['./festival-manager.component.css']
})
export class FestivalManagerComponent implements OnInit {
  festivals = signal<Festival[]>([]);
  isLoading = signal(false);

  constructor(
    private dialog: MatDialog,
    private festivalService: FestivalService
  ) {}

  ngOnInit(): void {
    this.loadFestivals();
  }

  loadFestivals(): void {
    this.isLoading.set(true);
    this.festivalService.getAll().subscribe({
      next: (festivals) => {
        this.festivals.set(festivals);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des festivals:', error);
        this.isLoading.set(false);
      }
    });
  }

  openCreateFestivalDialog(): void {
    const dialogRef = this.dialog.open(FestivalFormComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false
    });

    dialogRef.componentInstance.formSubmitted.subscribe(() => {
      dialogRef.close();
      this.loadFestivals();
      console.log('Festival créé avec succès');
    });

    dialogRef.componentInstance.formCancelled.subscribe(() => {
      dialogRef.close();
    });
  }
}
