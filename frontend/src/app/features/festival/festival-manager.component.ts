import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FestivalFormComponent } from './festival-form/festival-form.component';

@Component({
  selector: 'app-festival-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './festival-manager.component.html',
  styleUrls: ['./festival-manager.component.css']
})
export class FestivalManagerComponent implements OnInit {
  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {}

  openCreateFestivalDialog(): void {
    const dialogRef = this.dialog.open(FestivalFormComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false
    });

    dialogRef.componentInstance.formSubmitted.subscribe(() => {
      dialogRef.close();
      // Vous pouvez ajouter ici une logique pour rafraîchir la liste des festivals
      console.log('Festival créé avec succès');
    });

    dialogRef.componentInstance.formCancelled.subscribe(() => {
      dialogRef.close();
    });
  }
}
