export type OfficialRule = { code:string|null; title:string; content:string; sortOrder:number; active:true };
export type OfficialRuleCategory = { name:string; slug:string; description:string; sortOrder:number; active:true; rules:OfficialRule[] };

export function parseOfficialRules(text:string):OfficialRuleCategory[] {
  const definitions = {
    age: { name:'Aldersgrænsen', slug:'aldersgraensen', sortOrder:1, fallback:'Alderskrav og identitetskontrol på ZendixRP.' },
    general: { name:'Generelle regler', slug:'generelle', sortOrder:2, fallback:'Regler som gælder for alle spillere på ZendixRP.' },
    roleplay: { name:'Roleplay-regler', slug:'roleplay', sortOrder:3, fallback:'Regler for troværdigt og fair roleplay.' },
    company: { name:'Firma-regler', slug:'firma', sortOrder:4, fallback:'Regler for virksomheder, ansatte og ledelse.' },
    gang: { name:'Bande- og bandekrigsregler', slug:'bande', sortOrder:5, fallback:'Regler for bander, konflikter, zoner og krige.' },
    special: { name:'Specielle regler', slug:'specielle', sortOrder:6, fallback:'Regler for særlige situationer og scenarier.' },
  } as const;
  type Section=keyof typeof definitions;
  const parsed=Object.fromEntries(Object.keys(definitions).map((key)=>[key,{description:'',rules:[] as OfficialRule[]}])) as Record<Section,{description:string;rules:OfficialRule[]}>;
  let section:Section|null=null;let current:{code:string;title:string;contentLines:string[];sortOrder:number;active:true}|null=null;let descriptions:string[]=[];let readingDescription=false;const ageLines:string[]=[];
  const heading=(line:string):Section|null=>line.includes('Aldersgrænsen på Zendix')?'age':line.includes('Generelle Regler')?'general':line.includes('Roleplay Regler')?'roleplay':line.includes('Firma Regler')?'company':line.includes('Bande Regler')||line.includes('Bandekrig & Strikes')?'gang':line.includes('Specielle Regler')?'special':null;
  const finishRule=()=>{if(!current||!section)return;const content=current.contentLines.join('\n').trim();if(content)parsed[section].rules.push({code:current.code,title:current.title,content,sortOrder:current.sortOrder,active:true});current=null;};
  const finishDescription=()=>{if(!section||!descriptions.length||parsed[section].description)return;parsed[section].description=descriptions.join('\n').trim();descriptions=[];};
  for(const line of text.replace(/\r/g,'').split('\n').map((value)=>value.trim()).filter(Boolean)){
    const next=heading(line);if(next){finishRule();finishDescription();section=next;readingDescription=!parsed[section].rules.length&&!parsed[section].description;descriptions=[];continue;}
    if(!section)continue;
    if(/^\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}$/.test(line)){finishRule();finishDescription();if(section==='age'&&ageLines.length&&!parsed.age.rules.length)parsed.age.rules.push({code:null,title:'16+ aldersgrænse',content:ageLines.join('\n'),sortOrder:1,active:true});continue;}
    if(section==='age'){ageLines.push(line);continue;}
    const match=line.match(/^(\d+(?:\.\d+)+)\s+(.+)$/);if(match){finishDescription();finishRule();readingDescription=false;current={code:match[1],title:match[2],contentLines:[],sortOrder:parsed[section].rules.length+1,active:true};continue;}
    if(readingDescription&&!current)descriptions.push(line);else if(current)current.contentLines.push(line);
  }
  finishRule();finishDescription();if(ageLines.length&&!parsed.age.rules.length)parsed.age.rules.push({code:null,title:'16+ aldersgrænse',content:ageLines.join('\n'),sortOrder:1,active:true});
  return (Object.entries(definitions) as Array<[Section,(typeof definitions)[Section]]>).map(([key,definition])=>({name:definition.name,slug:definition.slug,description:parsed[key].description||definition.fallback,sortOrder:definition.sortOrder,active:true,rules:parsed[key].rules}));
}
