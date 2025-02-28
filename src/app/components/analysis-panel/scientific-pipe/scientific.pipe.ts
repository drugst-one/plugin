import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'scientific'
})
export class ScientificPipe implements PipeTransform {
  transform(value: number): string {
    if (isNaN(value) || value === 0) return value.toString();

    const scientific = value.toExponential();
    let [base, exponent] = scientific.split('e');

    const rounded = Number(base).toFixed(1).replace(/\.?0+$/, '');

    exponent = exponent.replace(/\+?0*(\-?\d+)/, '$1');

    return `${rounded}e${exponent}`;
  }
}
