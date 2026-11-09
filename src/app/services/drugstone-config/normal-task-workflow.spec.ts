import {DrugstoneConfigService} from './drugstone-config.service';
import {LaunchAnalysisComponent} from '../../dialogs/launch-analysis/launch-analysis.component';
import {NetworkMenuComponent} from '../../components/network/network-menu/network-menu.component';

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

describe('Normal plugin tasks without URL parameters', () => {
  async function startTask(config: DrugstoneConfigService) {
    let saved: any;
    const node = {id: 'A1BG', _group: 'default', group: 'default'};
    const network = {nodes: [node], edges: []};
    const analysis = {
      getSelection: () => [{id: node.id, data: node}], resetSelection: () => {},
      startAnalysis: jasmine.createSpy('startAnalysis').and.callFake(async (algorithm, target, parameters) => {
        saved = copy({algorithm, target, parameters});
        return 'normal-task';
      })
    };
    const dialog = new LaunchAnalysisComponent(analysis as any, config,
      {activeNetwork: {inputNetwork: network, getResetInputNetwork: () => copy(network)}} as any,
      {logMessage: () => {}} as any, {} as any);
    dialog.algorithm = 'degree';
    dialog.target = 'drug';
    await dialog.startTask();
    return saved;
  }

  it('starts with the complete config and restores its explicit lists and values when opened later', async () => {
    const config = new DrugstoneConfigService();
    config.config.showAdvAnalysisContent = [];
    config.config.algorithms.drug = ['degree'];
    config.config.physicsOn = false;
    const saved = await startTask(config);
    expect(saved.parameters.seeds).toEqual(['A1BG']);
    expect(saved.parameters.config).toEqual(config.config);
    config.config.showAdvAnalysisContent = ['drug-search', 'drug-target-search'];
    config.config.algorithms.drug = ['degree', 'trustrank'];
    config.config.physicsOn = true;
    const global = copy(config.config);
    config.set_analysisConfig(saved.parameters.config, 'task');
    expect(config.currentConfig().showAdvAnalysisContent).toEqual([]);
    expect(config.currentConfig().algorithms.drug).toEqual(['degree']);
    expect(config.currentConfig().physicsOn).toBe(false);
    expect(config.config).toEqual(global);
    config.currentConfig().algorithms.drug.push('trustrank');
    expect(saved.parameters.config.algorithms.drug).toEqual(['degree']);
  });

  it('keeps tasks isolated when switching results and restores the global config on close', async () => {
    const config = new DrugstoneConfigService();
    config.config.legendUrl = 'first.svg';
    const first = await startTask(config);
    config.config.legendUrl = 'second.svg';
    const second = await startTask(config);
    const global = copy(config.config);
    config.set_analysisConfig(first.parameters.config, 'task');
    config.currentConfig().nodeGroups.seedNode.groupName = 'Changed in first result';
    config.set_analysisConfig(second.parameters.config, 'task');
    expect(config.currentConfig().legendUrl).toBe('second.svg');
    expect(config.currentConfig().nodeGroups.seedNode.groupName).toBe('Seed Nodes');
    config.set_analysisConfig(first.parameters.config, 'task');
    expect(config.currentConfig().legendUrl).toBe('first.svg');
    expect(first.parameters.config.nodeGroups.seedNode.groupName).toBe('Seed Nodes');
    config.remove_analysisConfig();
    expect(config.currentConfig()).toBe(config.config);
    expect(config.config).toEqual(global);
  });

  it('retains task context and custom settings when changing the identifier in the result menu', async () => {
    const config = new DrugstoneConfigService();
    const saved = await startTask(config);
    config.set_analysisConfig(saved.parameters.config, 'task');
    config.currentConfig().nodeGroups.seedNode.groupName = 'My seeds';
    let source: string;
    config.configChanges.subscribe(change => source = change.source);
    const menu = new NetworkMenuComponent(config, {} as any, {} as any, {} as any, {} as any, {} as any);
    menu.changeIdspace('entrez');
    expect(config.currentConfig().identifier).toBe('entrez');
    expect(config.currentConfig().nodeGroups.seedNode.groupName).toBe('My seeds');
    expect(config.config.identifier).toBe('symbol');
    expect(source).toBe('task');
  });
});
