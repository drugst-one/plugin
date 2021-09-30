// From https://stackoverflow.com/a/27709336/3850564

import { ɵisListLikeIterable } from "@angular/core";
import { Node } from "./interfaces";

export function getGradientColor(startColor: string, endColor: string, percent: number) {
  // strip the leading # if it's there
  startColor = startColor.replace(/^\s*#|\s*$/g, '');
  endColor = endColor.replace(/^\s*#|\s*$/g, '');

  // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
  if (startColor.length === 3) {
    startColor = startColor.replace(/(.)/g, '$1$1');
  }

  if (endColor.length === 3) {
    endColor = endColor.replace(/(.)/g, '$1$1');
  }

  // get colors
  const startRed = parseInt(startColor.substr(0, 2), 16);
  const startGreen = parseInt(startColor.substr(2, 2), 16);
  const startBlue = parseInt(startColor.substr(4, 2), 16);

  const endRed = parseInt(endColor.substr(0, 2), 16);
  const endGreen = parseInt(endColor.substr(2, 2), 16);
  const endBlue = parseInt(endColor.substr(4, 2), 16);

  // calculate new color
  const diffRed = endRed - startRed;
  const diffGreen = endGreen - startGreen;
  const diffBlue = endBlue - startBlue;

  let diffRedStr = `${((diffRed * percent) + startRed).toString(16).split('.')[0]}`;
  let diffGreenStr = `${((diffGreen * percent) + startGreen).toString(16).split('.')[0]}`;
  let diffBlueStr = `${((diffBlue * percent) + startBlue).toString(16).split('.')[0]}`;

  // ensure 2 digits by color
  if (diffRedStr.length === 1) {
    diffRedStr = '0' + diffRedStr;
  }
  if (diffGreenStr.length === 1) {
    diffGreenStr = '0' + diffGreenStr;
  }
  if (diffBlueStr.length === 1) {
    diffBlueStr = '0' + diffBlueStr;
  }

  return '#' + diffRedStr + diffGreenStr + diffBlueStr;
}

export function removeUnderscoreFromKeys(obj) {
  const result = {};
  Object.keys(obj).forEach(x => {
    const y = x.replace("_", "");
    result[y] = obj[x];
  });
  return result;
}

// https://gist.github.com/whitlockjc/9363016
function trim (str) {
  return str.replace(/^\s+|\s+$/gm,'');
}

export function rgbaToHex (rgba) {
  const inParts = rgba.substring(rgba.indexOf("(")).split(","),
      r = parseInt(trim(inParts[0].substring(1)), 10),
      g = parseInt(trim(inParts[1]), 10),
      b = parseInt(trim(inParts[2]), 10),
      a: number = parseFloat(parseFloat(trim(inParts[3].substring(0, inParts[3].length - 1))).toFixed(2));
  const outParts = [
    r.toString(16),
    g.toString(16),
    b.toString(16),
    Math.round(a * 255).toString(16).substring(0, 2)
  ];

  // Pad single-digit output values
  outParts.forEach(function (part, i) {
    if (part.length === 1) {
      outParts[i] = '0' + part;
    }
  })

  return ('#' + outParts.join(''));
}

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

export function rgbToHex(rgb) {
  const inParts = rgb.substring(rgb.indexOf("(")).split(","),
      r = parseInt(trim(inParts[0].substring(1)), 10),
      g = parseInt(trim(inParts[1]), 10),
      b = parseInt(trim(inParts[2]), 10);
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// https://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes/47355187#47355187
export function standardize_color(str){
	var ctx = document.createElement("canvas").getContext("2d");
	ctx.fillStyle = str;
	return ctx.fillStyle.toString();
}

export function removeDuplicateObjectsFromList(nodes: Node[], attribute: string): Node[] {
  const seenIds = new Set();
  const filteredArray = new Array();
  for (const node of nodes) {
    if (node[attribute] != null && seenIds.has(node[attribute])) {
      continue;
    }
    filteredArray.push(node);
    seenIds.add(node[attribute]);
  }
  return filteredArray;
}

/**
 * Method is use to download file.
 * @param data - Array Buffer data
 * @param type - type of the document.
 */
export function downLoadFile(data: any, type: string, fmt: string) {
  let blob = new Blob([data], { type: type});
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `drugstone_network_${new Date().getTime()}.${fmt}`;
  a.click();
}

export function pieChartContextRenderer({ ctx, x, y, state: { selected, hover }, style, label }) {
    ctx.drawPieLabel = function(style, x, y, label) {
    ctx.font = "normal 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "black";
    ctx.fillText(label, x, y + style.size + 12);
  }

  ctx.drawPie = function(style, x, y) {
    const total = 1;
    let lastend = 0;

    // draw shadow
    if (style.shadow) {
      ctx.shadowColor = style.shadowColor;
      ctx.shadowOffsetX = style.shadowX;
      ctx.shadowOffsetY = style.shadowY;
      ctx.shadowBlur = 10;
    }

    ctx.fillStyle = style.color ? style.color : "red";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    var len = style.opacity/total * 2 * Math.PI;
    ctx.arc(x , y, style.size, lastend, lastend + len, false);
    ctx.lineTo(x, y);
    ctx.fill();
    if (style.opacity !== total) {
      // avoid the inner line when circle is complete
      ctx.stroke();
    }

    // draw a cricle
    ctx.beginPath();
    ctx.arc(x, y, style.size, 0, 2 * Math.PI);
    ctx.stroke();
  }

  return {
    // bellow arrows
    // primarily meant for nodes and the labels inside of their boundaries
    drawNode() {
      ctx.drawPie(style, x, y);
    },
    // above arrows
    // primarily meant for labels outside of the node
    drawExternalLabel() {
      ctx.drawPieLabel(style, x, y, label);
    },
    // node dimensions defined by node drawing
    // nodeDimensions: { width: style.size*2, height: style.size*2 },
  };
}

