import bpy, math, json, struct
from mathutils import Vector, Quaternion, Euler
from pathlib import Path
root=Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root/'apps/web/public/models/avatar-aj-signer-v8.glb'))
r=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
with open(root/'apps/web/public/models/avatar-aj-signer-v8.glb','rb') as f:
 f.read(12);length,_=struct.unpack('<II',f.read(8));gltf=json.loads(f.read(length))
nodes={n.get('name'):n for n in gltf['nodes']}
def pose_delta(name,angles):
 b=r.pose.bones.get(name)
 if not b:return
 q=nodes[name].get('rotation',[0,0,0,1]);g=Quaternion((q[3],q[0],q[1],q[2]))
 rest=b.bone.matrix_local.to_quaternion()
 parent=b.parent.bone.matrix_local.to_quaternion() if b.parent else Euler((math.pi/2,0,0)).to_quaternion()
 correction=(parent.inverted()@rest).inverted()@g
 b.rotation_mode='QUATERNION';b.rotation_quaternion=correction@Euler(angles,'XYZ').to_quaternion()@correction.inverted()
for side,sign in [('Left',1),('Right',-1)]:
 pose_delta(side+'Arm',(1.32,0,sign*.18))
 pose_delta(side+'ForeArm',(0,0,.30 if side=='Left' else -.18))
 pose_delta(side+'Hand',(0,.22 if side=='Left' else -.18,0))
 for finger in ['Index','Middle','Ring','Pinky']:
  for j,angle in [(1,.16),(2,.12),(3,.08)]:pose_delta(side+'Hand'+finger+str(j),(angle,0,0))
s=bpy.context.scene
s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.8,.8,.8,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.18
bpy.ops.object.camera_add(location=(0,-3.5,1.25));c=bpy.context.object;c.rotation_euler=(Vector((0,0,1.1))-c.location).to_track_quat('-Z','Y').to_euler();c.data.type='ORTHO';c.data.ortho_scale=1.9;s.camera=c
for loc,power,size in [((-2,-3,3.5),350,2.5),((2,-1,2),65,3),((1,2,3),260,2)]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(Vector((0,0,1.2))-l.location).to_track_quat('-Z','Y').to_euler()
s.render.engine='CYCLES';s.cycles.samples=48;s.render.resolution_x=900;s.render.resolution_y=1100;s.render.resolution_percentage=100;s.render.filepath=str(root/'assets/avatar/aj-v8-review.png');bpy.ops.render.render(write_still=True)
