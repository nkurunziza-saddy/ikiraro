"""Build a separate, weighted polo shell instead of painting the body as cloth."""
import bpy, bmesh, math
from mathutils import Vector

def tailor_polo(body,rig,character):
 scene=bpy.context.scene
 material=bpy.data.materials['AJ_Cloth']
 def mesh(name,vertices,faces):
  data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
  ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.data.materials.append(material)
  return ob
 N=64;vertices=[];faces=[]
 # Shaped chest, ease at the waist, and a soft tucked lower hem.
 rows=[(.79,.176,.106),(.805,.184,.112),(.84,.187,.116),(.92,.182,.115),(1.02,.181,.115),(1.13,.19,.12),(1.23,.202,.128),(1.29,.196,.123),(1.335,.157,.105),(1.37,.075,.061),(1.385,.052,.05)]
 for z,rx,ry in rows:
  for j in range(N):
   a=2*math.pi*j/N
   # Low-amplitude folds gather at the waist and under the arms.
   fold=.0035*math.sin(a*8+z*12)*math.exp(-((z-.87)/.10)**2)
   vertices.append(((rx+fold)*math.cos(a),.025+(ry+fold)*math.sin(a),z))
 for row in range(len(rows)-1):
  for j in range(N):
   a=row*N+j;b=row*N+(j+1)%N;faces.append((a,b,b+N,a+N))
 faces.extend([tuple(reversed(range(N))),tuple((len(rows)-1)*N+j for j in range(N))])
 shirt=mesh('AJ tailored polo',vertices,faces);parts=[shirt]
 for sign in [-1,1]:
  verts=[];polys=[]
  for x,r in [(.145,.084),(.19,.085),(.24,.080),(.29,.072),(.325,.068)]:
   for j in range(32):
    a=2*math.pi*j/32
    verts.append((sign*x,.025+r*math.cos(a),1.285+r*math.sin(a)))
  for row in range(4):
   for j in range(32):
    a=row*32+j;b=row*32+(j+1)%32;polys.append((a,b,b+32,a+32))
  polys.extend([tuple(reversed(range(32))),tuple(128+j for j in range(32))])
  parts.append(mesh('Polo sleeve',verts,polys))
 bpy.ops.object.select_all(action='DESELECT')
 for ob in parts:ob.select_set(True)
 bpy.context.view_layer.objects.active=shirt;bpy.ops.object.join()
 # Union the shoulder intersections into continuous fabric.
 shirt.data.remesh_voxel_size=.006;bpy.ops.object.voxel_remesh()
 mod=shirt.modifiers.new('Soft shoulder transitions','SMOOTH');mod.factor=1.1;mod.iterations=5
 bpy.ops.object.modifier_apply(modifier=mod.name)
 # Open the neck, sleeves, and waist rather than leaving capped tubes.
 bm=bmesh.new();bm.from_mesh(shirt.data)
 remove=[f for f in bm.faces if (f.calc_center_median().z<.8 or f.calc_center_median().z>1.376 or abs(f.calc_center_median().x)>.315)]
 bmesh.ops.delete(bm,geom=remove,context='FACES');bm.to_mesh(shirt.data);bm.free()
 sub=shirt.modifiers.new('Fabric surface','SUBSURF');sub.levels=1;bpy.ops.object.modifier_apply(modifier=sub.name)
 solid=shirt.modifiers.new('Fabric thickness','SOLIDIFY');solid.thickness=.0035;solid.offset=-1;bpy.ops.object.modifier_apply(modifier=solid.name)
 for group in body.vertex_groups:shirt.vertex_groups.new(name=group.name)
 transfer=shirt.modifiers.new('Tailored skin weights','DATA_TRANSFER');transfer.object=body;transfer.use_vert_data=True;transfer.data_types_verts={'VGROUP_WEIGHTS'};transfer.vert_mapping='POLYINTERP_NEAREST'
 bpy.ops.object.modifier_apply(modifier=transfer.name)
 arm=shirt.modifiers.new('Polo skin','ARMATURE');arm.object=rig;shirt.parent=rig
 for poly in shirt.data.polygons:poly.use_smooth=True
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.02);bpy.ops.object.mode_set(mode='OBJECT')
 character.append(shirt)
 # Remove the former painted shirt only after transferring its weights.
 bm=bmesh.new();bm.from_mesh(body.data)
 bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.material_index==5],context='FACES')
 bm.to_mesh(body.data);bm.free()
 # Fine fabric should catch broad highlights without looking chalky.
 p=material.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.58
 for node in material.node_tree.nodes:
  if node.type=='NORMAL_MAP':node.inputs['Strength'].default_value=.12
 return shirt
