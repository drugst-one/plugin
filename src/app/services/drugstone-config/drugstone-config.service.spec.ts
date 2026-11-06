import { TestBed } from '@angular/core/testing';

import { DrugstoneConfigService } from './drugstone-config.service';

describe('DrugstoneConfigService', () => {
  let service: DrugstoneConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DrugstoneConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('keeps display defaults when a task only stores analysis settings', () => {
    service.config.legendUrl = 'custom-legend.svg';
    const config = {identifier: 'entrez' as const, reviewed: false};
    let emitted: any;
    service.configChanges.subscribe(change => emitted = change);

    service.set_analysisConfig(config, 'task');

    expect(service.currentConfig().legendUrl).toBe('custom-legend.svg');
    expect(service.currentConfig().identifier).toBe('entrez');
    expect(service.currentConfig().reviewed).toBe(false);
    expect(emitted.config).toBe(service.currentConfig());
    expect('legendUrl' in config).toBe(false);
  });

  it('preserves explicit task values and leaves the global config unchanged', () => {
    service.config.legendUrl = 'global.svg';
    service.set_analysisConfig({legendUrl: ''} as any, 'task');
    expect(service.currentConfig().legendUrl).toBe('');
    expect(service.config.legendUrl).toBe('global.svg');
    service.remove_analysisConfig();
    expect(service.currentConfig().legendUrl).toBe('global.svg');
  });
});


describe('DrugstoneConfigService snapshot isolation', () => {
  it('does not let task-specific group changes modify the global settings', () => {
    const service = new DrugstoneConfigService();
    const before = JSON.stringify(service.config.nodeGroups);
    service.set_analysisConfig({identifier: 'entrez'}, 'task');
    service.currentConfig().nodeGroups['task-only'] = {} as any;
    expect(JSON.stringify(service.config.nodeGroups)).toBe(before);
  });
});


describe('DrugstoneConfigService task group defaults', () => {
  it('retains group names and styles when an external task stores an empty group map', () => {
    const service = new DrugstoneConfigService();
    const seedStyle = JSON.parse(JSON.stringify(service.config.nodeGroups.seedNode));
    service.set_analysisConfig({nodeGroups: {}}, 'task');
    expect(service.currentConfig().nodeGroups.seedNode).toEqual(seedStyle);
    expect(service.currentConfig().nodeGroups.firstNeighbor.groupName).toBe('First Neighbors');
  });

  it('retains unspecified group properties when only a task color is provided', () => {
    const service = new DrugstoneConfigService();
    const before = JSON.stringify(service.config);
    service.set_analysisConfig({nodeGroups: {seedNode: {color: {background: '#123456'}}}} as any, 'task');
    const seed = service.currentConfig().nodeGroups.seedNode;
    expect(seed.color.background).toBe('#123456');
    expect(seed.groupName).toBe('Seed Nodes');
    expect(seed.shape).toBe(service.config.nodeGroups.seedNode.shape);
    expect(JSON.stringify(service.config)).toBe(before);
  });
});
