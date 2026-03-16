import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FestivalFormComponent } from '../../festival-form/festival-form.component';
import { FestivalWorkspaceStore } from '../../../../core/store/festival-workspace.store';

@Component({
  selector: 'app-festival-workspace-root',
  standalone: true,
  imports: [CommonModule, FestivalFormComponent],
  templateUrl: './festival-workspace-root.component.html',
  styleUrls: ['./festival-workspace-root.component.css']
})
export class FestivalWorkspaceRootComponent {
  constructor(public store: FestivalWorkspaceStore) { }
}
