import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FestivalFormComponent } from '../../festival-form/festival-form.component';
import { FestivalWorkspaceStore } from '../../../../core/store/festival-workspace.store';
import { Router } from '@angular/router';

@Component({
  selector: 'app-festival-workspace-root',
  standalone: true,
  imports: [CommonModule, FestivalFormComponent],
  templateUrl: './festival-workspace-root.component.html',
  styleUrls: ['./festival-workspace-root.component.css']
})
export class FestivalWorkspaceRootComponent {
  constructor(
    public store: FestivalWorkspaceStore,
    private router: Router
  ) { }

  onFestivalDeleted(): void {
    this.router.navigate(['/festivals']);
  }
}
