"""Refine the v6 signer while preserving its source scene and rig."""
from pathlib import Path
import bpy, bmesh
import numpy as np
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/avatar/aj-signer-v6.blend'))
body=bpy.data.objects['Aj_Body'];rig=bpy.data.objects['Aj_Armature']
character=[rig]+[o for o in bpy.context.scene.objects if o.type=='MESH' and o.parent==rig and o.name!='Aj_Body_PreV6']
for b in rig.pose.bones:
 b.rotation_mode='QUATERNION';b.rotation_quaternion=(1,0,0,0);b.scale=(1,1,1)
# The exposed forearms were repainted sleeve geometry with raised cuffs.
# Retaper those rings into an anatomical forearm, leaving finger topology intact.
for poly in body.data.polygons:
 center=sum((body.data.vertices[i].co for i in poly.vertices), Vector())/len(poly.vertices)
 if poly.material_index==5 and abs(center.x)>.31 and center.z>1.18:poly.material_index=2
arm_vertices={i for p in body.data.polygons if p.material_index==2 for i in p.vertices}
for v in body.data.vertices:
 x=abs(v.co.x)
 if v.index in arm_vertices and .32<x<.612:
  dy=v.co.y-.04436;dz=v.co.z-1.279665
  radius=(dy*dy+dz*dz)**.5
  if radius>.001:
   t=max(0,min(1,(x-.32)/.285))
   target=.057*(1-t)+.029*t+.009*np.sin(np.pi*t)
   v.co.y=.04436+dy*target/radius;v.co.z=1.279665+dz*target/radius
# Scale geometry and joint positions together; taper the change at the wrist.
for side in ['Left','Right']:
 origin=rig.data.bones[side+'Hand'].head_local.copy()
 groups={g.index for g in body.vertex_groups if g.name.startswith(side+'Hand')}
 for v in body.data.vertices:
  weight=min(1,sum(g.weight for g in v.groups if g.group in groups))
  v.co=origin+(v.co-origin)*(1-.25*weight)
 bpy.context.view_layer.objects.active=rig
 bpy.ops.object.mode_set(mode='EDIT')
 for b in rig.data.edit_bones:
  if b.name.startswith(side+'Hand'):
   b.head=origin+(b.head-origin)*.75;b.tail=origin+(b.tail-origin)*.75
 bpy.ops.object.mode_set(mode='OBJECT')
# Keep the face atlas detail, lifting its warm skin pixels to a light tan.
face=bpy.data.materials['AJ_Face'];p=face.node_tree.nodes.get('Principled BSDF')
for link in list(p.inputs['Specular IOR Level'].links):face.node_tree.links.remove(link)
p.inputs['Specular IOR Level'].default_value=.34
p.inputs['Roughness'].default_value=.5
for node in face.node_tree.nodes:
 if node.type=='NORMAL_MAP':node.inputs['Strength'].default_value=.25
tex=next(n for n in face.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.colorspace_settings.name=='sRGB')
face.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
im=tex.image.copy();im.name='AJ warm tan face'
a=np.array(im.pixels[:],dtype=np.float32).reshape(-1,4)
mask=(a[:,0]>a[:,1]*1.12)&(a[:,1]>a[:,2]*1.08)&(a[:,0]>.08)
# Preserve baked facial shading without the near-black brown base.
light=np.clip(a[mask,0],0,1)
a[mask,:3]=np.stack([.50+.32*light,.29+.30*light,.18+.25*light],axis=1)
im.pixels.foreach_set(a.ravel());im.pack();tex.image=im
hands=bpy.data.materials['AJ_Hands'].node_tree.nodes.get('Principled BSDF')
hands.inputs['Base Color'].default_value=(.29,.135,.07,1)
hands.inputs['Roughness'].default_value=.52
hands.inputs['Specular IOR Level'].default_value=.32
# Add depth through the torso; the previous silhouette was almost planar.
cloth_vertices={i for poly in body.data.polygons if poly.material_index==5 for i in poly.vertices}
for v in body.data.vertices:
 if v.index in cloth_vertices and abs(v.co.x)<.23:
  v.co.y=.025+(v.co.y-.025)*1.18
# Weld coincident skin seams before subdivision so wrists remain continuous.
bm=bmesh.new();bm.from_mesh(body.data)
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0005)
bm.to_mesh(body.data);bm.free()
# Smooth angular low-poly joints before the armature deforms them.
bpy.context.view_layer.objects.active=body
sub=body.modifiers.new('Smooth skin silhouette','SUBSURF');sub.levels=1
bpy.ops.object.modifier_move_up(modifier=sub.name)
bpy.ops.object.modifier_apply(modifier=sub.name)
for poly in body.data.polygons:poly.use_smooth=True
# Portable knit normal map: a fine woven surface, embedded in the GLB.
n=512
y,x=np.mgrid[0:n,0:n]/n
height=.5+.12*np.cos(2*np.pi*x*96)+.10*np.cos(2*np.pi*y*96)
dy,dx=np.gradient(height)
normal=np.stack((-dx*.7,-dy*.7,np.ones_like(dx)),axis=-1)
normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
rgba=np.ones((n,n,4),dtype=np.float32);rgba[:,:,:3]=normal*.5+.5
knit=bpy.data.images.new('AJ fine polo knit',width=n,height=n,alpha=False)
knit.colorspace_settings.name='Non-Color';knit.pixels.foreach_set(rgba.ravel());knit.pack()
for name in ['AJ_Cloth','AJ_Polo_Collar']:
 p=bpy.data.materials[name].node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(.27,.46,.65,1);p.inputs['Roughness'].default_value=.68
 mat=bpy.data.materials[name];nodes=mat.node_tree.nodes
 tex=nodes.new('ShaderNodeTexImage');tex.image=knit
 nm=nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.25
 mat.node_tree.links.new(tex.outputs['Color'],nm.inputs['Color']);mat.node_tree.links.new(nm.outputs['Normal'],p.inputs['Normal'])
# Keep the buttons on the expanded shirt surface.
for o in character:
 if 'Buttons' in o.name:o.location.y-=.025
# Fill the narrow neck opening with a rounded, skinned neck surface.
verts=[];faces=[]
for z,radius in [(1.365,.043),(1.40,.047),(1.455,.05)]:
 for j in range(32):
  angle=2*np.pi*j/32;verts.append((radius*np.cos(angle),.025+radius*np.sin(angle),z))
for row in range(2):
 for j in range(32):
  a=row*32+j;b=row*32+(j+1)%32;faces.append((a,b,b+32,a+32))
mesh=bpy.data.meshes.new('Rounded neck');mesh.from_pydata(verts,[],faces);mesh.update()
neck=bpy.data.objects.new('AJ neck',mesh);bpy.context.scene.collection.objects.link(neck)
neck.data.materials.append(bpy.data.materials['AJ_Hands'])
for poly in mesh.polygons:poly.use_smooth=True
neck.vertex_groups.new(name='Neck').add(list(range(len(verts))),1,'REPLACE')
mod=neck.modifiers.new('Neck skin','ARMATURE');mod.object=rig;neck.parent=rig
character.append(neck)
# Give collar edges actual thickness and rounded highlights.
for o in character:
 if o.type=='MESH' and 'Collar' in o.name:
  bpy.context.view_layer.objects.active=o
  solid=o.modifiers.new('Fabric thickness','SOLIDIFY');solid.thickness=.003
  bpy.ops.object.modifier_apply(modifier=solid.name)
  bevel=o.modifiers.new('Rounded collar edge','BEVEL');bevel.width=.0015;bevel.segments=3
  bpy.ops.object.modifier_apply(modifier=bevel.name)
p=bpy.data.materials['Aj_Eyes_Cornea_MAT'].node_tree.nodes.get('Principled BSDF')
p.inputs['Roughness'].default_value=.32;p.inputs['Specular IOR Level'].default_value=.25
import sys
sys.path.insert(0,str(Path(__file__).parent))
from tailor_polo import tailor_polo
tailor_polo(body,rig,character)
from style_signer import style_signer
style_signer(body,rig,character)
bpy.ops.object.select_all(action='DESELECT')
for o in character:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(ROOT/'apps/web/public/models/avatar-aj-signer-v8.glb'),export_format='GLB',use_selection=True,export_animations=False,export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/avatar/aj-signer-v8.blend'))
