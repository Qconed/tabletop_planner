import { Directive, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[escClosable]',
  standalone: true
})
export class EscClosableDirective {

  @Output() esc = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape() {
    this.esc.emit();
  }
}