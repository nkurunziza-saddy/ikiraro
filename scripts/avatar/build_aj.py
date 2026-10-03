"""Refine the supplied Mixamo AJ; run in Blender or through Blender MCP.
Retains the FBX topology, UVs and skin weights. Each build gets a separate scene.
"""
import bpy
import bmesh
import hashlib
import json
import math
from pathlib import Path
from mathutils import Vector, Euler

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/avatar'
OUT.mkdir(parents=True, exist_ok=True)
scene = bpy.data.scenes.new('AJ • Signing studio')
if bpy.context.window:
    bpy.context.window.scene = scene
bpy.ops.import_scene.fbx(filepath=str(ROOT / 'Aj.fbx'), use_anim=False)
rig = next(o for o in scene.objects if o.type == 'ARMATURE')
body = next(o for o in scene.objects if o.type == 'MESH' and o.name.startswith('Boy01_Body_Geo'))
character = [o for o in scene.objects if o.type in {'MESH', 'ARMATURE'}]
rig.name = 'AJ_SigningRig'
# Normalize centimeters to meters, retaining the evaluated rest geometry.
bpy.ops.object.select_all(action='DESELECT')
for o in character:
    o.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
for b in rig.data.bones:
    b.name = b.name.removeprefix('mixamorig:')
# Blender renames matching deform groups with the armature bones.
for o in character:
    if o.type == 'MESH':
        for g in o.vertex_groups:
            g.name = g.name.removeprefix('mixamorig:')

# Connected components are stable for the supplied FBX; check topology before editing.
assert len(body.data.vertices) == 3980, 'AJ topology changed; inspect component selections again'
adj = [set() for _ in body.data.vertices]
for e in body.data.edges:
    a, b = e.vertices
    adj[a].add(b); adj[b].add(a)
seen = set(); components = {}
for v in body.data.vertices:
    if v.index in seen:
        continue
    todo = [v.index]; seen.add(v.index); ids = set()
    while todo:
        i = todo.pop(); ids.add(i)
        for j in adj[i]:
            if j not in seen:
                seen.add(j); todo.append(j)
    components[v.index] = ids
assert len(components[591]) == 271 and len(components[861]) == 271

def matte(name, color, roughness=0.8):
    mat = bpy.data.materials.new(name); mat.use_nodes = True
    p = mat.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Metallic'].default_value = 0
    return mat

cloth = matte('AJ • ink knit', (0.025, 0.047, 0.066))
trousers = matte('AJ • charcoal', (0.035, 0.042, 0.052))
skin = matte('AJ • warm hands', (0.63, 0.40, 0.27), 0.64)
hair = matte('AJ • soft brown hair', (0.035, 0.020, 0.013), 0.85)
frames = matte('AJ • glasses', (0.019, 0.023, 0.028), 0.65)
# Preserve AJ's textured face and hair; replace noisy garment textures.
for mat in body.data.materials:
    p = mat.node_tree.nodes.get('Principled BSDF')
    for name in ['Roughness','Metallic','Normal']:
        for link in list(p.inputs[name].links): mat.node_tree.links.remove(link)
    p.inputs['Roughness'].default_value = 0.78
    p.inputs['Metallic'].default_value = 0
for mat in [cloth, trousers, skin, frames, hair]: body.data.materials.append(mat)
slots = {mat.name: i for i, mat in enumerate(body.data.materials)}
assignments = {1133: hair, 0: frames, 38: frames, 76: frames, 591: skin, 861: skin, 1568: trousers, 2174: cloth, 2205: cloth, 2437: cloth}
for first, mat in assignments.items():
    ids = components[first]
    for p in body.data.polygons:
        if p.vertices[0] in ids: p.material_index = slots[mat.name]
# Remove only accessory islands: cap, backpack/straps/badges, cords and hood.
remove = set().union(*(components[i] for i in [80,104,128,461,479,497,519,537,555,573,2236,2416,3157]))
bm = bmesh.new(); bm.from_mesh(body.data); bm.verts.ensure_lookup_table()
bmesh.ops.delete(bm, geom=[bm.verts[i] for i in remove], context='VERTS')
bm.to_mesh(body.data); bm.free(); body.data.update()

# Increase the existing hands by 10%, preserving joint alignment and wrist seams.
hand_scale = 1.10
for side in ['Left','Right']:
    origin = rig.data.bones[side+'Hand'].head_local.copy()
    mesh_origin = body.matrix_world.inverted() @ rig.matrix_world @ origin
    group_ids = {g.index for g in body.vertex_groups if g.name.startswith(side+'Hand')}
    for v in body.data.vertices:
        weight = min(1.0, sum(g.weight for g in v.groups if g.group in group_ids))
        v.co = mesh_origin + (v.co-mesh_origin)*(1+(hand_scale-1)*weight)
    bpy.ops.object.select_all(action='DESELECT'); rig.select_set(True)
    bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
    for b in rig.data.edit_bones:
        if b.name.startswith(side+'Hand'):
            b.head = origin+(b.head-origin)*hand_scale
            b.tail = origin+(b.tail-origin)*hand_scale
    bpy.ops.object.mode_set(mode='OBJECT')
# One subdivision level softens the source's low-poly fingers without a heavy mesh.
bpy.ops.object.select_all(action='DESELECT'); body.select_set(True)
bpy.context.view_layer.objects.active = body
sub = body.modifiers.new('AJ • surface refinement', 'SUBSURF'); sub.levels = 1
# Subdivide rest topology before skinning, so runtime deformation matches Blender.
bpy.ops.object.modifier_move_up(modifier=sub.name)
bpy.ops.object.modifier_apply(modifier=sub.name)
for o in character:
    if o.type == 'MESH':
        for p in o.data.polygons: p.use_smooth = True

ns={'bpy':bpy}
surface_path=ROOT/'scripts/avatar/surface_aj.py'
exec(compile(surface_path.read_text(),str(surface_path),'exec'),ns)
ns['refine_surfaces'](body,OUT)

# Small controls on AJ's existing facial overlay meshes, no replacement face.
for o in character:
    if o.type != 'MESH' or o == body: continue
    o.shape_key_add(name='Basis', from_mix=False)
    coords = [v.co.copy() for v in o.data.vertices]
    center_z = sum(v.z for v in coords)/len(coords)
    if 'Brows' in o.name:
        for name, side, dz in [('browInnerUp',0,0.012),('browDownLeft',1,-0.009),('browDownRight',-1,-0.009)]:
            key=o.shape_key_add(name=name, from_mix=False); key.value=0
            for i,v in enumerate(coords):
                if side==0 or v.x*side>0: key.data[i].co.z += dz
    elif 'Eyes' in o.name:
        for side,sign in [('Left',1),('Right',-1)]:
            key=o.shape_key_add(name='eyeBlink'+side, from_mix=False); key.value=0
            for i,v in enumerate(coords):
                if v.x*sign>0: key.data[i].co.z=center_z+(v.z-center_z)*0.04
    else:
        for side,sign in [('Left',1),('Right',-1)]:
            key=o.shape_key_add(name='mouthSmile'+side, from_mix=False); key.value=0
            for i,v in enumerate(coords):
                if v.x*sign>0: key.data[i].co.z+=0.004*min(1,abs(v.x)/0.06)
        key=o.shape_key_add(name='jawOpen', from_mix=False); key.value=0
        for i,v in enumerate(coords):
            key.data[i].co.z -= 0.006*max(0,min(1,(center_z-v.z)/0.015))

calibration_path=ROOT/'scripts/avatar/calibrate_aj.py'
exec(compile(calibration_path.read_text(),str(calibration_path),'exec'),ns)
calibration=ns['calibrate'](rig)
for b in rig.pose.bones: b.rotation_quaternion=(1,0,0,0)
bpy.context.view_layer.update()
nails_path=ROOT/'scripts/avatar/nails_aj.py'
exec(compile(nails_path.read_text(),str(nails_path),'exec'),ns)
character.extend(ns['add_nails'](body,rig))
rig['ikiraro_avatar']='aj-mixamo-v2'
rig['hand_scale']=hand_scale
rig['source']='Aj.fbx'
rig['facial_controls_note']='Limited overlay controls; not a complete non-manual grammar rig'
# Export in neutral bind pose. Signing and idle are driven by the renderer.
bpy.ops.object.select_all(action='DESELECT')
for o in character: o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(ROOT/'apps/web/public/models/avatar-aj.glb'), export_format='GLB', use_selection=True, use_active_scene=True, export_animations=False, export_extras=True)
# Retain an editable breathing/settling reference loop in Blender only.
scene.render.fps=30; scene.frame_start=1; scene.frame_end=240
for f in range(1,242,4):
    t=(f-1)/30
    breath=math.sin(t*math.tau/4)
    for name,angles in {
        'RightArm':(1.32+0.008*breath,0,-0.18), 'LeftArm':(1.32+0.007*breath,0,0.18),
        'RightForeArm':(0,0,-0.12), 'LeftForeArm':(0,0,0.12),
        'Spine':(0.012+0.004*breath,0,0), 'Spine1':(0.003*breath,0,0),
        'Head':(0.02,0.006*math.sin(t*math.tau/8),0),
    }.items():
        b=rig.pose.bones[name]; b.rotation_mode='QUATERNION'; b.rotation_quaternion=Euler(angles,'XYZ').to_quaternion(); b.keyframe_insert(data_path='rotation_quaternion',frame=f)
if rig.animation_data and rig.animation_data.action: rig.animation_data.action.name='AJ • calm idle reference (8s)'
scene.frame_set(1)
world=bpy.data.worlds.new('AJ • neutral studio'); scene.world=world; world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(0.10,0.13,0.17,1)
world.node_tree.nodes['Background'].inputs[1].default_value=0.4
bpy.ops.object.camera_add(location=(0,-3.2,1.3));camera=bpy.context.object;camera.name='AJ • review camera'
camera.rotation_euler=(Vector((0,0,1.3))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=1.38;scene.camera=camera
for name,loc,power,size in [('Key',(-2,-3,3),300,3),('Fill',(2,-2,2),220,3),('Rim',(0,2,3),250,2)]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name='AJ • '+name;o.data.energy=power;o.data.shape='DISK';o.data.size=size
    o.rotation_euler=(Vector((0,0,1.3))-o.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'aj-studio.png')
bpy.ops.file.pack_all()
bpy.data.libraries.write(str(OUT/'aj-signing.blend'), {scene}, fake_user=True, compress=True)
bpy.ops.render.render(write_still=True)
report={'source':'Aj.fbx','source_sha256':hashlib.sha256((ROOT/'Aj.fbx').read_bytes()).hexdigest(),'hand_scale':hand_scale,'bones':len(rig.data.bones),'meshes':len([o for o in character if o.type=='MESH']),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in character if o.type=='MESH'),'export':'apps/web/public/models/avatar-aj.glb','blend':'assets/avatar/aj-signing.blend','idle':'8 second Blender reference; runtime procedural breathing and settling','facial_controls':'Limited AJ overlay deformations'}
(OUT/'aj-build-report.json').write_text(json.dumps(report,indent=2)+'\n')
