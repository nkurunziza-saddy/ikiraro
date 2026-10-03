"""Render actual calibrated joint poses for deformation review, not language certification."""
import bpy,json
from pathlib import Path
from mathutils import Quaternion,Euler
root=Path(__file__).resolve().parents[2]
s=bpy.context.scene;r=next(o for o in s.objects if o.type=='ARMATURE')
a=r.animation_data.action if r.animation_data else None
if r.animation_data:r.animation_data.action=None
shapes=json.loads((root/'packages/engine/src/planning/handshapes/asl.json').read_text())
for b in r.pose.bones:b.rotation_quaternion=(1,0,0,0)
for side in ['Right','Left']:
 for suffix in ['Arm','ForeArm','Hand']:
  b=r.pose.bones[side+suffix];q=b.bone['signingNeutral'];b.rotation_quaternion=Quaternion((q[3],q[0],q[1],q[2]))
for side,letter,mirror in [('Right','B',1),('Left','A',-1)]:
 p=shapes[letter]
 for finger,baseline in [('index',.10),('middle',.025),('ring',-.035),('pinky',-.10)]:
  v=p[finger]
  for j,rot in [(1,(v['mcp']*.80,0,(v['splay']+baseline)*mirror)),(2,(v['pip']*.9,0,0)),(3,(v['dip']*.65,0,0))]:r.pose.bones[side+'Hand'+finger.title()+str(j)].rotation_quaternion=Euler(rot,'XYZ').to_quaternion()
 for j,rot in [(1,(0,0,(.3+p['thumb']['splay']*.8)*mirror)),(2,(p['thumb']['flex']*.6,0,0)),(3,(p['thumb']['curl']*.7,0,0))]:r.pose.bones[side+'HandThumb'+str(j)].rotation_quaternion=Euler(rot,'XYZ').to_quaternion()
bpy.context.view_layer.update();s.render.filepath=str(root/'assets/avatar/aj-hand-calibration.png');bpy.ops.render.render(write_still=True)
if r.animation_data:r.animation_data.action=a
s.frame_set(1)
