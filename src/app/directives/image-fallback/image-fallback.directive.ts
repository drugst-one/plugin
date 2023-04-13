import { Directive, Input, HostBinding, HostListener } from '@angular/core';

@Directive({
  selector: 'img[fallback]'
})
export class ImageFallbackDirective {

  constructor() { }

  @Input()
  @HostBinding('src')
  src: string;

  @Input() fallback: string;

  @HostListener('error')
  onError() {
    this.src = this.fallback;
  }
}