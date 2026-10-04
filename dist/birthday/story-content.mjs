export const SCENE_STORY={
 aurora:{title:'今晚的极光，\n为你停留。',lead:'窗外很远的光，也照得到这一刻的你。'},
 sunset:{title:'把今晚的海风，\n留给你。',lead:'慢一点，听浪声把这一岁的祝福送来。'},
 garden:{title:'月光穿过花影，\n落在你身旁。',lead:'沿着花香，走进一间为你准备的房间。'},
 rings:{title:'越过千万颗星，\n终于抵达你。',lead:'今晚的宇宙，把最温柔的一束光留在这里。'},
 starlake:{title:'银河落进湖里，\n也落在你眼中。',lead:'那些安静的瞬间，正在慢慢发光。'}
};

export const RELATIONSHIP_COPY={
 gentle:{label:'温柔通用',message:'愿你有奔向远方的勇气，也有安心停靠的地方。'},
 friend:{label:'送给朋友',message:'新的一岁，愿我们继续分享小事，也一起去看更远的风景。'},
 love:{label:'送给爱人',message:'谢谢你走进我的生活。往后的日子，我也想和你慢慢走。'},
 family:{label:'送给家人',message:'谢谢你给我的温暖。新的一岁，愿你也被生活温柔照顾。'},
 self:{label:'送给自己',message:'这一年辛苦了。新的一岁，继续相信自己的光。'}
};

export const MEMORY_TYPES={photo:'照片',audio:'录音',note:'书信',object:'记忆小物件',secret:'你们的暗号'};
export function recipientMemories(items,included){return items.filter(item=>!item.sample&&(!included||included[item.type]!==false));}
