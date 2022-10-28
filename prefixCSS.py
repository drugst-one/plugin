import os
import shutil
import re
import subprocess
import argparse



def find_nth(haystack, needle, n):
    start = haystack.find(needle)
    while start >= 0 and n > 1:
        start = haystack.find(needle, start+len(needle))
        n -= 1
    return start

class ParserHTML:
    PREFIX = 'drugstone-plugin-'
    CLASSSEARCHPATTERN = 'class="'
    IDSEARCHPATTERN = 'id="'
    NGCLASSSEARCHPATTERN = '[ngClass]="'
    PARSEDFILENEDING = '.parsed'
    NGCLASSINDIVIDUALPATTERN = '[class.'
    TOOLTIPCLASSPATTERN = '[tooltipStyleClass]="'
    
    def __init__(self):
        pass
    
    def prefixNgIndivClassStrings(self, line, classStart):
        line = line[:classStart] + self.PREFIX + line[classStart:]
        return line 
    
    def prefixNgClassStrings(self, line, classStart):
        start = False
        classIndices = []
        stringComparison = False
        seenQuestionmark = False
        for i, c in enumerate(line[classStart:], classStart):
            if c == "'" and not stringComparison:
                if not start:
                    classIndices.append(i+1)
                    start = True
                else:
                    start = False
            elif c == '}' or c =='"':
                break
            elif c == ':' and not seenQuestionmark:
                stringComparison = True
            elif c == ',':
                stringComparison = False
                seenQuestionmark = False
            elif c == '?':
                # if we see a ?, the following : does not implicate a string comparison but a case separation
                seenQuestionmark = True
            
        for i, start in enumerate(classIndices):
            start += i * len(self.PREFIX)
            line = line[:start] + self.PREFIX + line[start:]
        return line
    
    def findClassStrings(self, line, classStart):
        classIndices = []
        start = classStart
        lastWasCurl = False
        lastWasClosingCurl = False
        inVariable = False
        for i, c in enumerate(line[classStart:], classStart):
            if (c == ' ' or c == '"') and not inVariable and i > start:
                classIndices.append((start, i))
                start = i + 1
            elif c == '{':
                if lastWasCurl:
                    inVariable = True
                lastWasCurl = True
            elif c == '}':
                if lastWasClosingCurl:
                    inVariable = False
                lastWasClosingCurl = True
            else:
                lastWasCurl = False
                lastWasClosingCurl = False
                
            if c == '"':
                return classIndices, i
        return classIndices, len(line)
    
    def updateClassStrings(self, line, classIndices, classStart, classEnd, iTagOpen):
        renamedClassList = []
        for start, end in classIndices:
            classString = line[start:end]
            if classString.startswith('ng-') or (iTagOpen and classString.startswith('fa') or classString.startswith('{')):
                renamedClassList.append(classString)
                continue
            renamedClass = self.prefixClass(classString)
            renamedClassList.append(renamedClass)
        return self.updateClasses(line, renamedClassList, classStart, classEnd)
        

    def prefixClass(self, classString):
        return self.PREFIX + classString
    
    def prefixtooltipStrings(self, line, tooltipClassStart):
        subline = line[tooltipClassStart:]
        start = subline.find("'")+1
        end = find_nth(subline, "'", 2)
        classStringList = subline[start:end].split(' ')
        classStringList = [self.prefixClass(x) for x in classStringList]
        line = line[:tooltipClassStart+start] + ' '.join(classStringList) + line[tooltipClassStart+end:]
        return line


    def updateClasses(self, line, renamedClassList, classStart, classEnd):
        renamedClassString = ' '.join(renamedClassList)
        return line[:classStart] + renamedClassString + line[classEnd:]


    def parseHtml(self, path):
        newLines = []
        with open(path) as f:
            content = ''
            # remove linebreaks in tags
            stringOpen = False
            for line in f:
                if not len(line.strip()):
                    continue
                # line.count('"') % 2 --> opened but not closed like [ngClass]="
                if line.count('"') % 2 and not line.strip().endswith('>'):
                    content += line.strip() + ' '
                    stringOpen = not stringOpen
                else:
                    if stringOpen:
                        # no new line
                        content += line.strip() + ' '
                    else:
                        # new line
                        content += line + '\n'   
                    
            iTagOpen = False
            for line in content.split('\n'):
                line = line.strip()
                if '<i' in line:
                    iTagOpen = True
                classStart = line.find(self.CLASSSEARCHPATTERN)
                if classStart > -1:
                    classStart += len(self.CLASSSEARCHPATTERN)
                    classIndices, classEnd = self.findClassStrings(line, classStart)
                    line = self.updateClassStrings(line, classIndices, classStart, classEnd, iTagOpen)
                    
                ngClassStart = line.find(self.NGCLASSSEARCHPATTERN)
                if ngClassStart > -1:
                    ngClassStart += len(self.NGCLASSSEARCHPATTERN)
                    line = self.prefixNgClassStrings(line, ngClassStart)
                    
                ngClassIndivStart = line.find(self.NGCLASSINDIVIDUALPATTERN)
                if ngClassIndivStart > -1:
                    ngClassIndivStart += len(self.NGCLASSINDIVIDUALPATTERN)
                    # exclude .fa classes
                    if not line[ngClassIndivStart:].startswith('fa-'):
                        line = self.prefixNgIndivClassStrings(line, ngClassIndivStart)
                        
                tooltipClassStart = line.find(self.TOOLTIPCLASSPATTERN)
                if tooltipClassStart > -1:
                    tooltipClassStart += len(self.TOOLTIPCLASSPATTERN)
                    line = self.prefixtooltipStrings(line, tooltipClassStart)
                    
                if self.IDSEARCHPATTERN in line:
                    line = line.replace(self.IDSEARCHPATTERN, self.IDSEARCHPATTERN + self.PREFIX)
                newLines.append(line)
                
                if '</i' in line:
                    iTagOpen = False
        return '\n'.join(newLines)

    def write(self, path, html):
        writePath = path + self.PARSEDFILENEDING
        with open(writePath, "w") as f:
            print(html, file=f)
        # overwrite file
        os.rename(writePath, path)

    def parseDirectory(self, directory):
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith(".component.html"):
                    if ('fa-icons' in file):
                        continue
                    path = os.path.join(root, file)
                    print('parsing', path)
                    html = self.parseHtml(path)
                    self.write(path, html)

class ParserJS:
    PREFIX = 'drugstone-plugin-'
    PARSEDFILENEDING = '.parsed'
    DIR = 'src/'
    
    ELEMENTBYIDSTRING = 'document.getElementById('
    
    def findId(self, line):
        start = line.find(self.ELEMENTBYIDSTRING) + len(self.ELEMENTBYIDSTRING)+1
        return start

    def replaceElementById(self, line):
        start = self.findId(line)
        line = line[:start] + self.PREFIX + line[start:]
        return line
    
    def parseJS(self, path):
        newLines = []
        with open(path) as f:
            for line in f:
                if self.ELEMENTBYIDSTRING in line:
                    line = self.replaceElementById(line)
                newLines.append(line)
        return '\n'.join(newLines)
    
    def write(self, path, html):
        writePath = path + self.PARSEDFILENEDING
        with open(writePath, "w") as f:
            print(html, file=f)
        # overwrite file
        os.rename(writePath, path)

    def parseDirectory(self, directory):
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith(".component.ts"):
                    path = os.path.join(root, file)
                    print('parsing', path)
                    html = self.parseJS(path)
                    self.write(path, html)

class ParserCSS:
    PREFIXCLASS = '.drugstone-plugin-'
    PREFIXID = '#drugstone-plugin-'
    PARSEDFILENEDING = '.parsed'
    DIR = 'src/'
    
    def __init__(self):
        pass

    def charIsNumber(self, x):
        try:
            int(x)
            return True
        except:
            return False

    def findClassEnding(self, line, start):
        start += 1
        for i, c in enumerate(line[start:], start):
            if c == '.' or c == ' ' or c == '{' or c ==',':
                return i
        return len(line)
    
    def findPotentialIdEnding(self, line, start):
        # can be id or hexacode color
        start += 1
        for i, c in enumerate(line[start:], start):
            if c == ';' or c == '}' or c == '!' or c == ' ' or c == ',':
                return i
        return len(line)

    def prefixClasses(self, classListString):
        classListStringList = classListString.split('.')
        classListStringList = [x for x in classListStringList if len(x)]
        classListStringList = [self.PREFIXCLASS + x if not (x.startswith('ng-') or x.startswith('p-') or x.startswith('pi-') or x.startswith('drugstone-plugin-') or x.startswith('fa-')) else '.' + x for x in classListStringList]
        return '.'.join(classListStringList)
    
    def prefixId(self, classListString):
        return classListString.replace('#', self.PREFIXID)

    def parseCSS(self, path):
        newLines = []
        with open(path) as f:
            for line in f:
                # leading white spaces are necessary for sass
                leadingWhiteSaces = len(line) - len(line.lstrip())
                line = line.strip()
                if line.startswith('//'):
                    # skip comments
                    continue
                if not len(line):
                    # skip empty lines as empty lines in the beginning of .sass files cause errors
                    continue
                
                if line.startswith('@import') or line.startswith('@forward') or line.startswith('@error') or line.startswith('@mixin') or line.startswith('@content') or line.startswith('src'):
                    line = leadingWhiteSaces*' ' + line
                    newLines.append(line)
                    # leave imports untouched
                    continue
                i = 0
                while i < len(line):
                    c = line[i]
                    if c == '.':
                        # i+1 < len(line) is necessary for online comments that end with a dot
                        if not i+1 < len(line):
                            i += 1
                            continue
                        if self.charIsNumber(line[i+1]):
                            i += 1
                            continue
                        
                        classListEnd = self.findClassEnding(line, i)
                        classListString = line[i:classListEnd]
                        renamedClasses = self.prefixClasses(classListString)
                        line = line[:i] + renamedClasses + line[classListEnd:]
                        i = classListEnd + renamedClasses.count(self.PREFIXCLASS)*len(self.PREFIXCLASS) - 2
                    elif c == '#':
                        if i+1 < len(line) and line[i+1] == '{':
                            i += 1
                            continue
                        # test if string is hexacode color
                        end = self.findPotentialIdEnding(line, i)
                        # end > -1 for color in comment
                        if end > -1 and re.search(r'^#(?:[0-9a-fA-F]{3}){1,2}$', line[i:end]):
                            i = end
                            continue
                        
                        classListEnd = self.findClassEnding(line, i)
                        classListString = line[i:classListEnd]
                        renamedClasses = self.prefixId(classListString)
                        line = line[:i] + renamedClasses + line[classListEnd:]
                        i += classListEnd + len(self.PREFIXID) - 2
                    i += 1
                # add white spaces
                line = leadingWhiteSaces*' ' + line
                newLines.append(line)
        return '\n'.join(newLines)

    
    def write(self, path, html):
        writePath = path + self.PARSEDFILENEDING
        with open(writePath, "w") as f:
            print(html, file=f)
        # overwrite file
        os.rename(writePath, path)

    def parseDirectory(self, directory):
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith(".scss") or file.endswith(".css") or file.endswith(".sass"):
                    path = os.path.join(root, file)
                    # skip ng select classes
                    if '@ng-select' in path:
                        continue
                    print('parsing', path)
                    scss = self.parseCSS(path)
                    self.write(path, scss)

    
class BuildManager:
    
    def __init__(self, buildPath):
        self.buildPath = buildPath
        
    def buildDevDir(self):
        shutil.copytree('src', os.path.join(self.buildPath, 'src'))
        shutil.copytree('node_modules', os.path.join(self.buildPath, 'node_modules'))
        
    def parseApp(self):
        ParserHTML().parseDirectory('src/app/')
        ParserCSS().parseDirectory('src/')
        ParserCSS().parseDirectory('node_modules/')
        ParserJS().parseDirectory('src/app/')
        
    def cleanup(self):
        shutil.rmtree('src')
        shutil.copytree(os.path.join(self.buildPath, 'src'), 'src')
        shutil.rmtree('node_modules')
        shutil.rmtree(self.buildPath)
        subprocess.run(['npm',  'i'])
        

ORIGDIR = 'original'

def parse():
    print('Starting parsing...')
    buildManager = BuildManager(ORIGDIR)
    try:
        buildManager.buildDevDir()
        buildManager.parseApp()
    except:
        raise Exception('ERROR: CSS prefix script failed.')
    print('Parsing done!')

def cleanup():
    print('Starting cleanup...')
    buildManager = BuildManager(ORIGDIR)
    buildManager.cleanup()
    print('Cleanup done!')
    
    
    
parser = argparse.ArgumentParser()
parser.add_argument("-s", "--stage", help = "Stage of building. Either 'parse' or 'cleanup'.")

    
if __name__ == '__main__':
    args = parser.parse_args()
    if not args.stage:
        raise Exception('Value for --stage is missing.')
       
    if args.stage == 'parse':
        try:
            parse()
        except:
            # in case it fails, try again after running a cleanup
            cleanup()
            try:
                parse()
            except:
                cleanup()
            
    elif args.stage == 'cleanup':
        cleanup()
    else:
        raise Exception(f'ERROR: Unknown argument for --stage: {args.stage}. Should be "parse" or "stage."')
       