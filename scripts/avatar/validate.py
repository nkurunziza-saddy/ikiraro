"""Validate the exported signing rig without Blender or browser dependencies."""
import json, math, struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def read_glb(path):
    with path.open('rb') as f:
        magic,version,size=struct.unpack('<III',f.read(12))
        assert magic==0x46546c67 and version==2 and size==path.stat().st_size
        length,kind=struct.unpack('<II',f.read(8))
        assert kind==0x4e4f534a
        return json.loads(f.read(length))
source=ROOT/'apps/web/public/models/avatar.glb'
output=ROOT/'apps/web/public/models/avatar-signing.glb'
old=read_glb(source);new=read_glb(output)
old_nodes={n.get('name'):n for n in old['nodes']}
new_nodes={n.get('name'):n for n in new['nodes']}
for side in ['Left','Right']:
    for name in ['Arm','ForeArm','Hand']+[f'Hand{finger}{joint}' for finger in ['Thumb','Index','Middle','Ring','Pinky'] for joint in [1,2,3]]:
        key=side+name
        assert key in new_nodes, f'Missing signing joint: {key}'
        a=old_nodes[key].get('rotation',[0,0,0,1]);b=new_nodes[key].get('rotation',[0,0,0,1])
        assert abs(abs(sum(x*y for x,y in zip(a,b)))-1)<1e-5, f'Joint axes changed: {key}'
controls=set()
for mesh in new['meshes']:
    controls.update(mesh.get('extras',{}).get('targetNames',[]))
    assert all(abs(w)<1e-8 for w in mesh.get('weights',[])), 'Export must start with a neutral face'
    for primitive in mesh['primitives']:
        for target in primitive.get('targets',[]):
            accessor=new['accessors'][target['POSITION']]
            assert all(math.isfinite(v) and abs(v)<0.02 for v in accessor.get('min',[])+accessor.get('max',[])), 'Excessive facial deformation'
assert {'browInnerUp','browDownLeft','browDownRight','mouthSmileLeft','mouthSmileRight','jawOpen'} <= controls
assert len(new['meshes'])==4
print(json.dumps({'rig_axes':'compatible','face':'neutral','facial_controls':sorted(controls),'original_bytes':source.stat().st_size,'new_bytes':output.stat().st_size,'reduction_percent':round(100*(1-output.stat().st_size/source.stat().st_size),1)},indent=2))
