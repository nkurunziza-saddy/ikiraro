"""Author the stylized Ikiraro signer. Run in Blender or with --background --python.
The existing scenes and original Avaturn source are preserved. All new geometry,
textures, and review poses are reproducible; the exported GLB stays in bind pose.
"""
import bpy, bmesh, math, json, random
import numpy as np
from pathlib import Path
from mathutils import Vector, Euler, Quaternion
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/avatar'
OUT.mkdir(parents=True, exist_ok=True)
scene = bpy.data.scenes.new('Ikiraro • Amani signing studio')
bpy.context.window.scene = scene
bpy.ops.import_scene.gltf(filepath=str(ROOT/'apps/web/public/models/avatar.glb'))
rig = next(o for o in scene.objects if o.type == 'ARMATURE')
source = {key:next(o for o in scene.objects if o.name.startswith('avaturn_'+key)) for key in ['body','look_0','hair_0','shoes_0']}
body, clothes = source['body'], source['look_0']
character = [rig, body, clothes, source['shoes_0']]
for o in list(scene.objects):
    if o not in character:
        scene.collection.objects.unlink(o) if o.name in scene.collection.objects else None
        for c in list(o.users_collection):
            if c in list(scene.collection.children): c.objects.unlink(o)
rig.name = 'Amani_SigningRig'

def active(o):
    if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active=o

def mat(name, color, rough=0.65):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Roughness'].default_value=rough
    return m
skin=mat('Amani • warm terracotta skin',(0.34,0.145,0.082),0.63)
skin.node_tree.nodes.get('Principled BSDF').inputs['Subsurface Weight'].default_value=0.055
lip=mat('Amani • muted rose lips',(0.21,0.065,0.048),0.72)
crease=mat('Amani • soft facial definition',(0.075,0.024,0.017),0.8)
hairmat=mat('Amani • espresso curls',(0.025,0.013,0.009),0.83)
eye=mat('Amani • ivory sclera',(0.73,0.66,0.54),0.35)
iris=mat('Amani • chestnut iris',(0.09,0.032,0.012),0.35)
pupil=mat('Amani • pupils',(0.004,0.003,0.002),0.28)
thread=mat('Amani • collar and cuff rib',(0.013,0.062,0.058),0.9)
pants=mat('Amani • charcoal trousers',(0.026,0.036,0.043),0.87)
shoesmat=mat('Amani • charcoal shoes',(0.022,0.027,0.031),0.78)
cloth=mat('Amani • woven deep teal',(0.02,0.088,0.081),0.92)
# A small seamless woven normal texture, embedded in the GLB. The texture is
# deliberately subtle: hand silhouettes, not a fabric pattern, carry the scene.
n=256
v,u=np.mgrid[0:n,0:n].astype(np.float32)/n
h=0.5+0.20*np.cos(2*math.pi*u*32)+0.15*np.cos(2*math.pi*v*32)+0.08*np.sin(2*math.pi*(u+v)*16)
dy,dx=np.gradient(h)
normal=np.stack((-dx*1.5,-dy*1.5,np.ones_like(dx)),axis=-1);normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
rgba=np.ones((n,n,4),dtype=np.float32);rgba[:,:,:3]=normal*0.5+0.5
im=bpy.data.images.new('Amani woven normal',width=n,height=n,alpha=True)
im.colorspace_settings.name='Non-Color';im.pixels.foreach_set(rgba.ravel());im.filepath_raw=str(OUT/'woven-normal.png');im.file_format='PNG';im.save();im.pack()
for m in [cloth,thread]:
    nodes=m.node_tree.nodes; links=m.node_tree.links
    tex=nodes.new('ShaderNodeTexImage');tex.image=im
    normalmap=nodes.new('ShaderNodeNormalMap');normalmap.inputs['Strength'].default_value=0.32
    links.new(tex.outputs['Color'],normalmap.inputs['Color']);links.new(normalmap.outputs['Normal'],nodes.get('Principled BSDF').inputs['Normal'])

def material(o,m):
    o.data.materials.clear();o.data.materials.append(m)
    for p in o.data.polygons:p.use_smooth=True

def mesh(name,verts,faces,m):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);material(o,m);return o

def bind(o,bone='Head'):
    vg=o.vertex_groups.new(name=bone);vg.add(list(range(len(o.data.vertices))),1,'REPLACE')
    mod=o.modifiers.new('Signing skeleton','ARMATURE');mod.object=rig;o.parent=rig
    character.append(o);return o

def sphere(name,loc,scale,m,segments=24,rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);material(o,m);return o

def tube(name,points,radii,m,sides=8):
    verts=[];faces=[]
    for i,p in enumerate(points):
        tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(i-1,0)])
        tangent.normalize();a=tangent.cross(Vector((0,1,0))).normalized();b=tangent.cross(a).normalized()
        radius=radii[i] if isinstance(radii,list) else radii
        for j in range(sides):verts.append(Vector(p)+radius*(a*math.cos(j*math.tau/sides)+b*math.sin(j*math.tau/sides)))
    for i in range(len(points)-1):
        for j in range(sides):a=i*sides+j;b=i*sides+(j+1)%sides;faces.append((a,b,b+sides,a+sides))
    faces += [tuple(reversed(range(sides))),tuple((len(points)-1)*sides+j for j in range(sides))]
    return mesh(name,verts,faces,m)

# Keep the original deforming hands and their skin weights, with a smooth wrist transition.
hand_scale=1.18
for side in ['Left','Right']:
    origin=rig.data.bones[side+'Hand'].head_local.copy()
    groups={g.index for g in body.vertex_groups if g.name.startswith(side+'Hand')}
    for vert in body.data.vertices:
        w=min(1,sum(g.weight for g in vert.groups if g.group in groups))
        if w:vert.co=origin+(vert.co-origin)*(1+(hand_scale-1)*w)
    active(rig);bpy.ops.object.mode_set(mode='EDIT')
    for b in rig.data.edit_bones:
        if b.name.startswith(side+'Hand'):
            b.head=origin+(b.head-origin)*hand_scale;b.tail=origin+(b.tail-origin)*hand_scale
    bpy.ops.object.mode_set(mode='OBJECT')
# Replace the scanned head. Retain a short neck underneath the new sculpt.
bm=bmesh.new();bm.from_mesh(body.data)
bmesh.ops.delete(bm,geom=[v for v in bm.verts if v.co.z>1.61],context='VERTS');bm.to_mesh(body.data);bm.free()
body.name='Amani • articulated skin';material(body,skin)
# Source trousers retain their leg weights. The shirt is replaced with new geometry.
# Weight transfer must happen before removing the original shirt.

def torso():
    rows=[(0.985,.171,.103), (1.005,.183,.111),(1.04,.186,.115),(1.13,.190,.12),(1.26,.211,.13),(1.38,.224,.134),(1.46,.222,.127),(1.495,.198,.115),(1.52,.135,.085),(1.535,.060,.058)]
    verts=[];faces=[];N=64
    for z,rx,ry in rows:
        for j in range(N):
            a=j*math.tau/N;verts.append((rx*math.cos(a),.032+ry*math.sin(a),z))
    for i in range(len(rows)-1):
        for j in range(N):a=i*N+j;b=i*N+(j+1)%N;faces.append((a,b,b+N,a+N))
    faces.extend([tuple(reversed(range(N))),tuple((len(rows)-1)*N+j for j in range(N))])
    return mesh('Amani • sweater',verts,faces,cloth)
sweater=torso();parts=[sweater]
for side,sign in [('Left',1),('Right',-1)]:
    points=[(sign*x,.043,z) for x,z in [(.165,1.478),(.22,1.5),(.29,1.505),(.39,1.505),(.46,1.505),(.53,1.505),(.56,1.505)]]
    parts.append(tube('Sleeve',points,[.085,.086,.079,.066,.060,.054,.052],cloth,32))
active(sweater)
for o in parts:o.select_set(True)
bpy.ops.object.join()
sweater.data.remesh_voxel_size=.010;bpy.ops.object.voxel_remesh()
mod=sweater.modifiers.new('Soft knit silhouette','SMOOTH');mod.factor=1.4;mod.iterations=5;bpy.ops.object.modifier_apply(modifier=mod.name)
mod=sweater.modifiers.new('Surface refinement','SUBSURF');mod.levels=1;bpy.ops.object.modifier_apply(modifier=mod.name)
# Transfer existing cloth weights by nearest surface interpolation.
for g in clothes.vertex_groups:sweater.vertex_groups.new(name=g.name)
mod=sweater.modifiers.new('Tailored skinning','DATA_TRANSFER');mod.object=clothes;mod.use_vert_data=True;mod.data_types_verts={'VGROUP_WEIGHTS'};mod.vert_mapping='POLYINTERP_NEAREST'
bpy.ops.object.modifier_apply(modifier=mod.name)
mod=sweater.modifiers.new('Signing skeleton','ARMATURE');mod.object=rig;sweater.parent=rig;character.append(sweater)
# UVs are generated once and travel with the exported textile maps.
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.02);bpy.ops.object.mode_set(mode='OBJECT')
material(sweater,cloth)
bm=bmesh.new();bm.from_mesh(clothes.data);bmesh.ops.delete(bm,geom=[v for v in bm.verts if v.co.z>1.025],context='VERTS');bm.to_mesh(clothes.data);bm.free();clothes.name='Amani • trousers';material(clothes,pants)
material(source['shoes_0'],shoesmat)
# Ribbed crewneck and rolled sleeve cuffs; their weights follow the same skeleton.
points=[(.061*math.cos(a),.032+.059*math.sin(a),1.532) for a in np.linspace(0,math.tau,65)]
bind(tube('Amani • crewneck',points,.009,thread,10),'Spine2')
for side,sgn in [('Left',1),('Right',-1)]:
    pts=[(sgn*.548,.043+.053*math.cos(a),1.505+.053*math.sin(a)) for a in np.linspace(0,math.tau,49)]
    bind(tube('Amani • '+side+' cuff',pts,.011,thread,10),side+'ForeArm')

# Continuous sculpted head surface with broad cheeks, a soft jaw and integrated nose.
rows=[(1.602,.025,.031),(1.612,.055,.050),(1.633,.077,.063),(1.665,.095,.078),(1.705,.111,.091),(1.75,.120,.102),(1.795,.119,.106),(1.835,.116,.107),(1.874,.103,.096),(1.905,.076,.073),(1.925,.039,.041),(1.932,.003,.003)]
verts=[];faces=[];N=96
for z,rx,ry in rows:
    for j in range(N):
        a=j*math.tau/N;x=rx*math.cos(a);y=.022+ry*math.sin(a)
        front=max(0,-math.sin(a))**12
        nose=.037*math.exp(-(x/.024)**2-((z-1.736)/.028)**2)+.015*math.exp(-(x/.018)**2-((z-1.783)/.047)**2)
        cheek=.006*math.exp(-((abs(x)-.062)/.031)**2-((z-1.714)/.035)**2)
        y-=front*(nose+cheek)
        verts.append((x,y,z))
for i in range(len(rows)-1):
    for j in range(N):a=i*N+j;b=i*N+(j+1)%N;faces.append((a,b,b+N,a+N))
faces.extend([tuple(reversed(range(N))),tuple((len(rows)-1)*N+j for j in range(N))])
head=mesh('Amani • face',verts,faces,skin);active(head)
mod=head.modifiers.new('Sculpt finish','SUBSURF');mod.levels=2;bpy.ops.object.modifier_apply(modifier=mod.name);bind(head)
# Paint subtle cheek warmth as vertex color (portable glTF COLOR_0).
paint=head.data.color_attributes.new(name='Skin warmth',type='FLOAT_COLOR',domain='POINT')
for v in head.data.vertices:
    x,y,z=v.co;warm=math.exp(-((abs(x)-.070)/.037)**2-((z-1.718)/.036)**2)*max(0,-y/.09)
    paint.data[v.index].color=(.34+.045*warm,.145-.015*warm,.082-.006*warm,1)
vc=skin.node_tree.nodes.new('ShaderNodeVertexColor');vc.layer_name='Skin warmth'
# Only the face uses vertex paint, so retain a plain material for the hands.
face_mat=skin.copy();face_mat.name='Amani • painted face';face_mat.node_tree.links.new(face_mat.node_tree.nodes.get(vc.name).outputs['Color'],face_mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);material(head,face_mat)
face_parts=[head];brow_parts=[];eye_parts=[];mouth_parts=[]
for side,sgn in [('Left',1),('Right',-1)]:
    ear=bind(sphere('Amani • '+side+' ear',(sgn*.119,.023,1.746),(.021,.023,.036),skin));face_parts.append(ear)
    earinner=bind(sphere('Amani • '+side+' ear inset',(sgn*.128,.001,1.746),(.009,.005,.021),lip,16,12));face_parts.append(earinner)
    x=sgn*.047;z=1.792
    sclera=bind(sphere('Amani • '+side+' eye',(x,-.079,z),(.027,.013,.014),eye,32,16));eye_parts.append(sclera)
    ir=bind(sphere('Amani • '+side+' iris',(x-sgn*.001,-.091,z),(.010,.004,.0105),iris));eye_parts.append(ir)
    pu=bind(sphere('Amani • '+side+' pupil',(x-sgn*.001,-.0945,z),(.0048,.002,.006),pupil,20,12));eye_parts.append(pu)
    for upper in [True,False]:
        pts=[]
        for i in range(25):
            a=math.pi*i/24;xx=x+.027*math.cos(a);zz=z+(1 if upper else -1)*.0125*math.sin(a)
            pts.append((xx,-.083-.006*math.sin(a),zz))
        lid=bind(tube('Amani • '+side+(' upper lid' if upper else ' lower lid'),pts,.0028 if upper else .002,skin,8));eye_parts.append(lid)
    pts=[(sgn*(.020+.055*i/20),-.081+.012*i/20,1.824+.009*math.sin(math.pi*i/20)-.004*i/20) for i in range(21)]
    brow=bind(tube('Amani • '+side+' brow',pts,[.003+.0035*math.sin(math.pi*i/20)**.6 for i in range(21)],hairmat,8));brow_parts.append(brow)
# Sculpted lips and a quiet, closed-mouth resting expression.
for kind in ['upper','lower','seam']:
    pts=[]
    for i in range(33):
        t=-1+2*i/32;x=.037*t;z=1.676+.005*t*t
        if kind=='upper':z+=.003*(1-t*t)-.0015*math.exp(-(t/.2)**2)
        if kind=='lower':z-=.0035*(1-t*t)
        pts.append((x,-.073-.009*(1-t*t),z))
    radius=[(.0011 if kind=='seam' else .0025)*(.3+.7*math.sin(math.pi*i/32)**.6) for i in range(33)]
    ob=bind(tube('Amani • mouth '+kind,pts,radius,crease if kind=='seam' else lip,8));mouth_parts.append(ob)
# Small nostril accents sit beneath the integrated nose.
for sgn in [-1,1]:
    face_parts.append(bind(sphere('Amani • nostril',(sgn*.014,-.112,1.726),(.005,.002,.0028),lip,16,8)))
# Sculpted curl cap: compact, varied locks forming one cohesive silhouette.
hairparts=[]
cap=sphere('Amani • hair cap',(0,.029,1.823),(.118,.110,.12),hairmat,40,24)
bm=bmesh.new();bm.from_mesh(cap.data);bmesh.ops.delete(bm,geom=[v for v in bm.verts if v.co.z < 1.81+max(0,-v.co.y)*.34],context='VERTS');bm.to_mesh(cap.data);bm.free();hairparts.append(cap)
rng=random.Random(14)
for row,(phi,count) in enumerate([(0.15,7),(.42,12),(.70,17),(.96,21),(1.18,24)]):
    for j in range(count):
        a=math.tau*(j+.45*(row%2))/count
        loc=(.106*math.sin(phi)*math.cos(a),.029+.100*math.sin(phi)*math.sin(a),1.823+.112*math.cos(phi))
        sz=.020+rng.random()*.006
        curl=sphere('Sculpted curl',loc,(sz,sz*.90,sz*.78),hairmat,12,8);hairparts.append(curl)
active(cap)
for o in hairparts:o.select_set(True)
bpy.ops.object.join();bind(cap)
# Shape keys are authored on each component so eyebrows/lips move with the face.
facial=face_parts+brow_parts+mouth_parts
for ob in facial:
    ob.shape_key_add(name='Basis')
    for name in ['browInnerUp','browDownLeft','browDownRight','mouthSmileLeft','mouthSmileRight','jawOpen']:
        key=ob.shape_key_add(name=name)
        for i,v in enumerate(ob.data.vertices):
            x,y,z=v.co;delta=Vector((0,0,0))
            if 'brow' in name:
                w=math.exp(-((z-1.824)/.025)**2)*max(0,min(1,(-y-.025)/.04))
                if name=='browInnerUp':delta.z=.012*w*math.exp(-(x/.080)**2)
                elif (x>0)==name.endswith('Left'):delta.z=-.009*w
            elif 'Smile' in name:
                sign=1 if name.endswith('Left') else -1
                w=math.exp(-((x-sign*.033)/.025)**2-((z-1.677)/.024)**2)*max(0,min(1,(-y-.02)/.04))
                delta.x=sign*.003*w;delta.z=.007*w
            elif name=='jawOpen':
                w=math.exp(-(x/.068)**2-((z-1.646)/.045)**2)*max(0,min(1,(-y-.02)/.04));delta.z=-.010*w
            key.data[i].co+=delta
for ob in eye_parts:
    ob.shape_key_add(name='Basis');key=ob.shape_key_add(name='eyeBlinkLeft' if 'Left' in ob.name else 'eyeBlinkRight')
    for i,v in enumerate(ob.data.vertices):key.data[i].co.z=1.792+(v.co.z-1.792)*.07
# Export unposed. Studio review pose is deliberately separate from bind transforms.
rig['ikiraro_rig_version']='2.0';rig['avatar_style']='Amani / sculpted stylized';rig['hand_scale']=hand_scale
bpy.context.view_layer.update();active(rig)
for ob in character:ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'apps/web/public/models/avatar-signing.glb'),export_format='GLB',use_selection=True,export_animations=False,export_extras=True)
# Soft photographic studio without a remote HDR dependency.
world=bpy.data.worlds.new('Amani • warm grey studio');scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.13,.16,.17,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45
bpy.ops.object.camera_add(location=(0,-3.6,1.40));camera=bpy.context.object;camera.name='Amani • review camera';camera.rotation_euler=(Vector((0,0,1.40))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=1.33;scene.camera=camera
for name,loc,power,size in [('Key',(-2,-3,3.4),260,3),('Fill',(2,-2,2.1),170,3),('Rim',(1,1.8,3),260,2)]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name='Amani • '+name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1.5))-o.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES';scene.cycles.samples=32
scene.render.resolution_x=900;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'avatar-studio.png')
scene.view_settings.view_transform='AgX'
# Read the original GLB bind node rotations to reproduce renderer XYZ deltas
# in Blender even when the importer has corrected the bone display axes.
import struct
with open(ROOT/'apps/web/public/models/avatar-signing.glb','rb') as f:
    f.read(12);length,kind=struct.unpack('<II',f.read(8));gltf=json.loads(f.read(length))
nodes={n.get('name'):n for n in gltf['nodes']}
def pose_delta(name,angles):
    b=rig.pose.bones.get(name)
    if not b:return
    q=nodes[name].get('rotation',[0,0,0,1]);g=Quaternion((q[3],q[0],q[1],q[2]))
    rest=b.bone.matrix_local.to_quaternion()
    parent=b.parent.bone.matrix_local.to_quaternion() if b.parent else Euler((math.pi/2,0,0)).to_quaternion()
    local=parent.inverted()@rest
    correction=local.inverted()@g
    b.rotation_mode='QUATERNION';b.rotation_quaternion=correction@Euler(angles,'XYZ').to_quaternion()@correction.inverted()
# Relaxed, low ready pose. This same profile is used by the web renderer.
for side,sgn in [('Right',-1),('Left',1)]:
    pose_delta(side+'Arm',(1.15,0,sgn*.18));pose_delta(side+'ForeArm',(0,-sgn*.15,sgn*.48))
    for finger in ['Index','Middle','Ring','Pinky']:
        for j,val in [(1,.16),(2,.1),(3,.06)]:pose_delta(side+'Hand'+finger+str(j),(val,0,0))
pose_delta('Neck',(-.025,0,0));pose_delta('Head',(.025,0,0))
bpy.context.view_layer.update()
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'signing-avatar.blend'))
report={'style':'Amani — sculpted stylized signer','hand_scale':hand_scale,'bones':len(rig.data.bones),'meshes':len([o for o in character if o.type=='MESH']),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in character if o.type=='MESH'),'export':'apps/web/public/models/avatar-signing.glb','source':'assets/avatar/signing-avatar.blend','textures':['woven-normal.png'],'facial_controls':['browInnerUp','browDownLeft','browDownRight','mouthSmileLeft','mouthSmileRight','jawOpen','eyeBlinkLeft','eyeBlinkRight']}
(OUT/'build-report.json').write_text(json.dumps(report,indent=2))
result=report
