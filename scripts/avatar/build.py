"""Rebuild the imported signing avatar, retaining the source rig and UVs.
Run: blender --background --factory-startup --python scripts/avatar/build.py
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/avatar'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'apps/web/public/models/avatar.glb'))
scene = bpy.context.scene
rig = next(o for o in scene.objects if o.type == 'ARMATURE')
body = bpy.data.objects['avaturn_body']
# Imported helper meshes are bone widgets, not part of the delivered character.
character = [o for o in scene.objects if o.type in {'MESH','ARMATURE'} and (o == rig or o.name.startswith('avaturn_'))]
for o in scene.objects:
    if o not in character: o.hide_render = True
# Enlarge each hand around the wrist, tapering through skin weights at the seam.
hand_scale = 1.12
wrist_origins = {side: rig.data.bones[side+'Hand'].head_local.copy() for side in ['Left','Right']}
for side,origin in wrist_origins.items():
    groups = {g.index for g in body.vertex_groups if g.name.startswith(side+'Hand')}
    for v in body.data.vertices:
        weight = min(1.0,sum(g.weight for g in v.groups if g.group in groups))
        if weight: v.co = origin + (v.co-origin)*(1+(hand_scale-1)*weight)
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True); bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
for side,origin in wrist_origins.items():
    for b in rig.data.edit_bones:
        if b.name.startswith(side+'Hand'):
            b.head = origin+(b.head-origin)*hand_scale
            b.tail = origin+(b.tail-origin)*hand_scale
bpy.ops.object.mode_set(mode='OBJECT')
# One matte clothing material: no bright shirt/buttons or texture noise behind hands.
def matte(name,color):
    mat=bpy.data.materials.new(name); mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value=(*color,1)
    bsdf.inputs['Roughness'].default_value=0.82
    return mat
cloth=matte('Signing • graphite blue', (0.028,0.062,0.091))
clothes=bpy.data.objects['avaturn_look_0']; clothes.data.materials.clear(); clothes.data.materials.append(cloth)
hair=bpy.data.objects['avaturn_hair_0']; hair.data.materials.clear(); hair.data.materials.append(matte('Signing • hair',(0.014,0.009,0.007)))
for o in character:
    if o.type=='MESH':
        for poly in o.data.polygons: poly.use_smooth=True
# Facial deformation targets are local to the face, keeping the rest of the mesh fixed.
# They are intentionally modest and separately addressable for renderer calibration.
body.shape_key_add(name='Basis', from_mix=False)
def gaussian(x,c,w): return math.exp(-((x-c)/w)**2*2)
def add_face_key(name,fn):
    key=body.shape_key_add(name=name, from_mix=False)
    key.value=0.0
    for i,v in enumerate(body.data.vertices):
        x,y,z=v.co
        if z < 1.57 or y > -0.025: continue
        delta=fn(x,y,z)
        if delta is not None: key.data[i].co += Vector(delta)
for side,sign in [('Left',1),('Right',-1)]:
    add_face_key('browDown'+side,lambda x,y,z,s=sign:(0,0,-0.009*gaussian(x,s*0.035,0.029)*gaussian(z,1.748,0.019)))
    add_face_key('mouthSmile'+side,lambda x,y,z,s=sign:(s*0.006*gaussian(x,s*0.026,0.020)*gaussian(z,1.665,0.024),0,0.008*gaussian(x,s*0.026,0.020)*gaussian(z,1.665,0.024)))
add_face_key('browInnerUp',lambda x,y,z:(0,0,0.011*gaussian(x,0,0.047)*gaussian(z,1.748,0.019)))
add_face_key('jawOpen',lambda x,y,z:(0,-0.003*gaussian(x,0,0.055)*gaussian(z,1.635,0.035),-0.009*gaussian(x,0,0.055)*gaussian(z,1.635,0.035)))
# Export only the actual signer. Keep rig and material authoring in a packed .blend.
rig['ikiraro_rig_version']='1.0'
rig['hand_scale']=hand_scale
rig['facial_controls']='browInnerUp,browDownLeft,browDownRight,mouthSmileLeft,mouthSmileRight,jawOpen'
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for o in character: o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(ROOT/'apps/web/public/models/avatar-signing.glb'),export_format='GLB',use_selection=True,export_animations=False,export_extras=True)
# An editable studio scene with neutral frontal lighting.
world=bpy.data.worlds.new('Signing studio') if not scene.world else scene.world
scene.world=world; world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(0.10,0.13,0.17,1)
world.node_tree.nodes['Background'].inputs[1].default_value=0.35
bpy.ops.object.camera_add(location=(0,-3.2,1.38))
camera=bpy.context.object; camera.name='Signing review camera'
camera.rotation_euler=(Vector((0,0,1.25))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'; camera.data.ortho_scale=1.65; scene.camera=camera
for name,loc,power,size in [('Key',(-2,-3,3),350,3),('Fill',(2,-2,2),250,3),('Rim',(0,2,3),300,2)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    light=bpy.context.object;light.name=name;light.data.energy=power;light.data.shape='DISK';light.data.size=size
    light.rotation_euler=(Vector((0,0,1.3))-light.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=720;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(OUT/'avatar-studio.png')
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'signing-avatar.blend'))
# Studio reference shows the rest topology, not an asserted ASL sign.
bpy.ops.render.render(write_still=True)
with open(OUT/'build-report.json','w') as f:
    json.dump({'hand_scale':hand_scale,'meshes':len([o for o in character if o.type=='MESH']),'triangles':sum(len(o.data.polygons) for o in character if o.type=='MESH'),'bones':len(rig.data.bones),'facial_controls':list(body.data.shape_keys.key_blocks.keys()),'export':'apps/web/public/models/avatar-signing.glb'},f,indent=2)
