import { ScientificPipe } from './scientific.pipe';

describe('ScientificPipe', () => {
  it('create an instance', () => {
    const pipe = new ScientificPipe();
    expect(pipe).toBeTruthy();
  });
});
