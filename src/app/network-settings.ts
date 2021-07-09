import {getGradientColor} from './utils';
import {
  Node,
} from './interfaces';
import { IConfig, defaultConfig} from './config';

export class NetworkSettings {

  // colors
  private static Grey = '#A0A0A0'
  private static White = '#FFFFFF';
  private static Black = '#000000';

  // Node color
  private static hostColor = '#123456';
  private static approvedDrugColor = '#48C774';
  private static unapprovedDrugColor = '#F8981D';
  private static nonSeedHostColor = '#3070B3';
  private static nonSeedVirusColor = '#87082c';

  private static selectedBorderColor = '#F8981D';
  private static selectBorderHighlightColor = '#F8981D';

  private static seedBorderColor = '#F8981D';
  private static seedBorderHighlightColor = '#F8981D';

  // Edge color
  private static edgeHostVirusColor = '#686868';
  private static edgeHostVirusHighlightColor = '#686868';
  private static edgeHostDrugColor = '#686868';
  private static edgeHostDrugHighlightColor = '#686868';
  private static edgeGeneGeneColor = '#686868';
  private static edgeGeneGeneHighlightColor = '#686868';


  // Border width for nodes in selection
  private static selectedBorderWidth = 3;
  private static selectedBorderWidthSelected = 3;
  // Border width for seed nodes
  private static seedBorderWidth = 3;
  private static seedBorderWidthSelected = 3;
  // Border width
  private static borderWidth = 1;
  private static borderWidthSelected = 3;

  // Node Font
  private static hostFontSize = 20;
  private static drugFontSize = 30;
  private static hostFontColor = NetworkSettings.White;
  private static drugFontColor = NetworkSettings.White;
  private static drugInTrialFontColor = NetworkSettings.Black;

  // Network Layout
  private static analysisLayout = {
    improvedLayout: true,
  };
  private static analysisEdges = {
    smooth: false,
  };
  private static analysisPhysics = {
    enabled: true,
    stabilization: {
      enabled: true,
    },
    repulsion: {
      centralGravity: 0,
    },
    solver: 'repulsion',
  };
  private static analysisBigPhysics = {
    enabled: false,
  };

  private static mainLayout = {
    improvedLayout: false,
  };
  private static mainEdges = {
    smooth: false,
    length: 250,
  };
  private static mainPhysics = {
    enabled: false,
  };

  // Node size
  private static hostSize = 20;
  private static drugSize = 15;

  // Node shape
  private static hostShape = 'ellipse';
  private static drugNotInTrialShape = 'box';
  private static drugInTrialShape = 'triangle';

  // static getNodeSize(wrapperType: WrapperType) {
  //   if (wrapperType === 'protein') {
  //     return this.hostSize;
  //   } else if (wrapperType === 'drug') {
  //     return this.drugSize;
  //   }
  // }

  // static getNodeShape(wrapperType: WrapperType, drugInTrial?: boolean) {
  //   if (wrapperType === 'protein') {
  //     return this.hostShape;
  //   } else if (wrapperType === 'drug') {
  //     if (drugInTrial) {
  //       return this.drugInTrialShape;
  //     } else {
  //       return this.drugNotInTrialShape;
  //     }
  //   }
  // }

  static getOptions(network: 'main' | 'analysis' | 'analysis-big') {
    if (network === 'main') {
      return {
        layout: this.mainLayout,
        edges: this.mainEdges,
        physics: this.mainPhysics,
      };
    } else if (network === 'analysis') {
      return {
        layout: this.analysisLayout,
        edges: this.analysisEdges,
        physics: this.analysisPhysics,
      };
    } else if (network === 'analysis-big') {
      return {
        layout: this.analysisLayout,
        edges: this.analysisEdges,
        physics: this.analysisBigPhysics,
      };
    }
  }

  static getColor(color: 'protein' | 'approvedDrug' | 'unapprovedDrug' | 'hostFont' | 'drugFont' |
    'nonSeedHost' | 'selectedForAnalysis' | 'selectedForAnalysisText' |
    'edgeHostDrug' | 'edgeHostDrugHighlight' | 'edgeGeneGene' | 'edgeGeneGeneHighlight') 
    /**
     * Collection of all colors per use-case
     */
    {
    if (color === 'protein') {
      return this.hostColor;
    } else if (color === 'approvedDrug') {
      return this.approvedDrugColor;
    } else if (color === 'unapprovedDrug') {
      return this.unapprovedDrugColor;
    } else if (color === 'hostFont') {
      return this.hostFontColor;
    } else if (color === 'drugFont') {
      return this.drugFontColor;
    } else if (color === 'nonSeedHost') {
      return this.nonSeedHostColor;
    } else if (color === 'edgeHostDrug') {
      return this.edgeHostDrugColor;
    } else if (color === 'edgeHostDrugHighlight') {
      return this.edgeHostDrugHighlightColor;
    } else if (color === 'edgeGeneGene') {
      return this.edgeGeneGeneColor;
    } else if (color === 'edgeGeneGeneHighlight') {
      return this.edgeGeneGeneHighlightColor;
    }
  }

  // static getFont(wrapperType: WrapperType, drugInTrial?: boolean) {
  //   if (wrapperType === 'protein') {
  //     return {color: this.hostFontColor, size: this.hostFontSize};
  //   } else if (wrapperType === 'drug') {
  //     if (!drugInTrial) {
  //       return {color: this.drugFontColor, size: this.drugFontSize};
  //     } else {
  //       return {color: this.drugInTrialFontColor, size: this.drugFontSize};
  //     }
  //   }
  // }

  static getNodeStyle(
    node: Node,
    config: IConfig,
    isSeed: boolean,
    isSelected: boolean,
    drugType?: string,
    drugInTrial?: boolean,
    gradient?: number): any {

      if (!gradient) {
        gradient = -1.0;
      }
      let nodeGroupObject;
      if (node.group === 'default') {
        nodeGroupObject = defaultConfig.nodeGroups.default;
      } else {
        nodeGroupObject = config.nodeGroups[node.group];
      }
      let nodeColor;
      if (gradient === null) {
        nodeColor = NetworkSettings.Grey;
      } else {
        nodeColor = getGradientColor(NetworkSettings.White, nodeGroupObject.color, gradient);
      }
      // vis js style attributes
      const nodeShadow = true;
      // const nodeShape = node.shape;
      // const nodeSize = 10;
      // const nodeFont = node.font;
      console.log("is selected")
      console.log(isSelected)

      if (isSeed) {
        node.color = {
          background: nodeColor,
          border: this.seedBorderColor,
          highlight: {
            border: this.seedBorderHighlightColor,
            background: nodeColor
          }
        }; 
        node.borderWidth = this.seedBorderWidth;
        node.borderWidthSelected = this.seedBorderWidthSelected;
      } else if (isSelected) {
        node.color = {
          background: nodeColor,
          border: this.selectedBorderColor,
          highlight: {
            border: this.selectBorderHighlightColor,
            background: nodeColor
          }
        }; 
        node.borderWidth = this.selectedBorderWidth;
        node.borderWidthSelected = this.selectedBorderWidthSelected;
      } else {
        node.color = nodeColor;
        node.borderWidth = this.borderWidth;
        node.borderWidthSelected = this.borderWidthSelected;
      }
      return node;
    }

  // static getNodeStyleOld(nodeType: WrapperType,
  //                     isSeed: boolean,
  //                     isSelected: boolean,
  //                     drugType?: string,
  //                     drugInTrial?: boolean,
  //                     gradient?: number): any {
  //   if (!gradient) {
  //     gradient = 1.0;
  //   }
  //   let nodeColor;
  //   let nodeShape;
  //   let nodeSize;
  //   let nodeFont;
  //   const nodeShadow = true;
  //   nodeShape = NetworkSettings.getNodeShape(nodeType);
  //   nodeSize = NetworkSettings.getNodeSize(nodeType);
  //   nodeFont = NetworkSettings.getFont(nodeType);
  //   if (nodeType === 'protein') {
  //     nodeColor = NetworkSettings.getColor(nodeType);
  //     nodeFont = NetworkSettings.getFont('protein');
  //     if (!isSeed) {
  //       nodeColor = NetworkSettings.getColor('nonSeedHost');
  //     }
  //   } else if (nodeType === 'drug') {
  //     if (drugType === 'approved') {
  //       nodeColor = NetworkSettings.getColor('approvedDrug');
  //     } else {
  //       nodeColor = NetworkSettings.getColor('unapprovedDrug');
  //     }
  //     if (drugInTrial) {
  //       nodeShape = NetworkSettings.getNodeShape('drug', true);
  //       nodeFont = NetworkSettings.getFont('drug', true);
  //     } else {
  //       nodeShape = NetworkSettings.getNodeShape('drug', false);
  //     }
  //   }

  //   if (gradient === -1) {
  //     nodeColor = NetworkSettings.GREY;
  //   } else {
  //     nodeColor = getGradientColor(NetworkSettings.WHITE, nodeColor, gradient);
  //   }

  //   const node: any = {
  //     size: nodeSize,
  //     shape: nodeShape,
  //     font: nodeFont,
  //     shadow: nodeShadow,
  //   };

    // if (isSelected) {
    //   node.color = {
    //     background: nodeColor,
    //     border: this.selectedBorderColor,
    //     highlight: {
    //       border: this.selectBorderHighlightColor,
    //       background: nodeColor,
    //     },
    //   };

    //   node.borderWidth = this.selectedBorderWidth;
    //   node.borderWidthSelected = this.selectedBorderWidthSelected;
    // } else {
    //   node.color = nodeColor;

    //   node.borderWidth = this.borderWidth;
    //   node.borderWidthSelected = this.borderWidthSelected;
    // }

  //   return node;
  // }
}

