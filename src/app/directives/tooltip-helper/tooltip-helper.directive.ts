import { Directive, Self, Optional, OnInit } from '@angular/core';
import { Tooltip } from 'primeng/tooltip';

@Directive({
  standalone: false,
  selector: '[pTooltip]'
})
export class TooltipHelperDirective implements OnInit {
  constructor(@Self() @Optional() private tooltip: Tooltip) {}

  ngOnInit() {
    if (this.tooltip) {
      if (!this.tooltip.tooltipStyleClass) {
        const position = this.tooltip.tooltipPosition || 'right';
        this.tooltip.tooltipStyleClass = `drugstone-plugin-drgstn drugstone-plugin-drgstn-tooltip drugstone-plugin-drgstn-tooltip-${position}`;
      }
    }
  }
}
