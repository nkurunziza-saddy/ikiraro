"""Save an editable three-second wave reference using the runtime calibration."""
import bpy,json,math
from pathlib import Path
from mathutils import Quaternion,Euler
root=Path(__file__).resolve().parents[2];scene=bpy.context.scene
rig=next(o for o in scene.objects if o.type=='ARMATURE')
if rig.animation_data and rig.animation_data.action:
    rig.animation_data.action.use_fake_user=True
    rig.animation_data.action=None
shapes=json.loads((root/'packages/engine/src/planning/handshapes/asl.json').read_text())
for b in rig.pose.bones:b.rotation_mode='QUATERNION';b.rotation_quaternion=(1,0,0,0)
# Left hand rests; right hand retains the open B handshape during the wave.
for name,angles in {'LeftArm':(1.32,0,.18),'LeftForeArm':(0,0,.12)}.items():
    rig.pose.bones[name].rotation_quaternion=Euler(angles,'XYZ').to_quaternion()
p=shapes['B']
for finger,spread in [('index',.10),('middle',.025),('ring',-.035),('pinky',-.10)]:
    v=p[finger]
    for j,rot in [(1,(v['mcp']*.8,0,v['splay']+spread)),(2,(v['pip']*.9,0,0)),(3,(v['dip']*.65,0,0))]:
        rig.pose.bones['RightHand'+finger.title()+str(j)].rotation_quaternion=Euler(rot,'XYZ').to_quaternion()
for j,rot in [(1,(0,0,.3+p['thumb']['splay']*.8)),(2,(p['thumb']['flex']*.6,0,0)),(3,(p['thumb']['curl']*.7,0,0))]:
    rig.pose.bones['RightHandThumb'+str(j)].rotation_quaternion=Euler(rot,'XYZ').to_quaternion()
for f in range(1,92):
    p=(f-1)/90;wave=math.sin(p*math.pi*4)*math.sin(p*math.pi)**2
    for suffix,gain in [('Arm',.035),('ForeArm',.10),('Hand',.22)]:
        b=rig.pose.bones['Right'+suffix];q=b.bone['signingNeutral']
        b.rotation_quaternion=Quaternion((q[3],q[0],q[1],q[2]))@Euler((0,0,wave*gain),'XYZ').to_quaternion()
    for b in rig.pose.bones:b.keyframe_insert(data_path='rotation_quaternion',frame=f)
rig.animation_data.action.name='AJ • restrained wave review';rig.animation_data.action.use_fake_user=True
scene.frame_start=1;scene.frame_end=91;scene.render.fps=30;scene.frame_set(22)
scene.render.filepath=str(root/'assets/avatar/aj-wave-review.png');bpy.ops.render.render(write_still=True)
bpy.data.libraries.write(str(root/'assets/avatar/aj-motion-review.blend'),{scene},fake_user=True,compress=True)
# Keep Blender on the actual revised scene in material preview and camera framing.
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_perspective='CAMERA'
            area.spaces.active.overlay.show_overlays=False
            area.spaces.active.shading.type='MATERIAL'
