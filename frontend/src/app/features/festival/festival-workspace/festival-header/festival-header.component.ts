import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { FestivalWorkspaceStore } from '../../../../core/store/festival-workspace.store';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-festival-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: "./festival-header.component.html",
  styleUrls: ['./festival-header.component.css']
})
export class FestivalHeaderComponent {
  constructor(
    public store: FestivalWorkspaceStore,
    public authService: AuthService,
    private router: Router
  ) { }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: () => {
        this.router.navigate(['/']);
      }
    });
  }
}
