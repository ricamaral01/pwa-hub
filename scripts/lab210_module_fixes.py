"""Only the two new Lab units: spaced shortcuts and mobile unit-code aliases."""
def desktop(source):
 old="quick.className = 'module-page-quick';"
 new="quick.className = 'module-page-quick' + (['pederneiras','ribeirao'].includes(selectedUnit) ? ' module-page-quick-links' : '');"
 assert source.count(old)==1
 return source.replace(old,new)
def mobile_cards(source):
 old='    link.append(code, name, arrow);'
 new="""    if (item?.id?.startsWith('labPedeCec') || item?.id?.startsWith('labRibCec')) {
      link.style.setProperty('height','auto','important');
      link.style.setProperty('min-height','56px','important');
      link.style.setProperty('padding','8px 14px','important');
      link.style.setProperty('align-items','center','important');
      name.style.display='flex';name.style.flexDirection='column';name.style.gap='2px';
      name.style.setProperty('height','auto','important');
    }
    link.append(code, name, arrow);"""
 assert source.count(old)==1
 return source.replace(old,new)
def mobile(source):
 old="const initialUnit=units.find(unit=>unitKey(unit)===unitKey(requestedUnit));"
 new="const cecUnitNames={pederneiras:'Pederneiras',ribeirao:'Ribeirão Preto'};\n    const requestedName=moduleId==='laboratorio' ? (cecUnitNames[requestedUnit]||requestedUnit) : requestedUnit;\n    const initialUnit=units.find(unit=>unitKey(unit)===unitKey(requestedName));"
 assert source.count(old)==1;source=source.replace(old,new)
 old='function render() {\n      unitTabs.replaceChildren();'
 new="function render() {\n      quick.classList.toggle('module-page-quick-links', moduleId==='laboratorio' && ['Pederneiras','Ribeirão Preto'].includes(active.unit));\n      unitTabs.replaceChildren();"
 assert source.count(old)==1
 return mobile_cards(source.replace(old,new))
