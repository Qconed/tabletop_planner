import { Component, input, effect, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FestivalWorkspaceStore } from '../../../core/store/festival-workspace.store';
import { FestivalHeaderComponent } from './festival-header/festival-header.component';

@Component({
  selector: 'app-festival-workspace-shell',
  standalone: true,
  imports: [RouterOutlet, FestivalHeaderComponent],
  templateUrl: './festival-workspace-shell.component.html',
})
export class FestivalWorkspaceShellComponent implements OnDestroy {
  id = input<string>();

  constructor(private store: FestivalWorkspaceStore) {
    effect(() => {
      const festivalId = this.id();
      if (festivalId && !isNaN(Number(festivalId))) {
        this.store.setFestivalId(Number(festivalId));
      } else {
        this.store.setFestivalId(null);
      }
    });
  }

  ngOnDestroy(): void {
    this.store.clear();
  }
}
