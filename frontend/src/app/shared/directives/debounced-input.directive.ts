import { Directive, HostListener, OnDestroy, input, output } from '@angular/core';

@Directive({
  selector: '[appDebouncedInput]'
})
export class DebouncedInputDirective implements OnDestroy {
  readonly debounceTime = input(300);
  readonly debouncedValueChange = output<string>();

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.scheduleEmit(value);
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.flush(value);
  }

  private scheduleEmit(value: string): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.debouncedValueChange.emit(value);
      this.timeoutId = null;
    }, this.debounceTime());
  }

  private flush(value: string): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.debouncedValueChange.emit(value);
  }
}
