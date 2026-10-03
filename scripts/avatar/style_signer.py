"""Folded collar, tucked waist, belt and swept hair details for the signer."""
import bpy, math
from mathutils import Vector

def style_signer(body,rig,character):
 def material(name,color,rough=.5,metal=0):
  m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
  p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
  return m
 def bind(ob,mat,bone):
  ob.data.materials.clear();ob.data.materials.append(mat)
  for p in ob.data.polygons:p.use_smooth=True
  ob.vertex_groups.new(name=bone).add(list(range(len(ob.data.vertices))),1,'REPLACE')
  mod=ob.modifiers.new('Accessory skin','ARMATURE');mod.object=rig;ob.parent=rig;character.append(ob)
  return ob
 def mesh(name,verts,faces,mat,bone):
  data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
  ob=bpy.data.objects.new(name,data);bpy.context.scene.collection.objects.link(ob)
  return bind(ob,mat,bone)
 def box(name,loc,scale,mat,bone,bevel=.003):
  bpy.ops.mesh.primitive_cube_add(size=1,location=loc);ob=bpy.context.object;ob.name=name;ob.scale=scale
  bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
  mod=ob.modifiers.new('Soft edges','BEVEL');mod.width=bevel;mod.segments=3;bpy.ops.object.modifier_apply(modifier=mod.name)
  return bind(ob,mat,bone)
 # Replace the flat collar triangles with a continuous turned-down collar.
 for ob in list(character):
  if 'Collar' in ob.name:
   character.remove(ob);ob.hide_render=True
 collar=bpy.data.materials['AJ_Cloth']
 verts=[];faces=[];N=64
 for row in range(4):
  t=row/3
  for j in range(N+1):
   a=-math.pi/2+.23+(2*math.pi-.46)*j/N
   end=math.exp(-(min(j,N-j)/5)**2)
   r=.052+.038*t
   z=1.395-.04*t-.019*t*end
   verts.append((r*math.cos(a),.025+r*math.sin(a),z))
 for row in range(3):
  for j in range(N):
   a=row*(N+1)+j;faces.append((a,a+1,a+N+2,a+N+1))
 ob=mesh('AJ folded polo collar',verts,faces,collar,'Spine2');bpy.context.view_layer.objects.active=ob
 solid=ob.modifiers.new('Collar cloth thickness','SOLIDIFY');solid.thickness=.003;bpy.ops.object.modifier_apply(modifier=solid.name)
 # A subtle placket sits below the collar, with three raised buttons.
 box('AJ polo placket',(0,-.103,1.302),(.019,.004,.102),collar,'Spine2',.002)
 for ob in list(character):
  if 'Buttons' in ob.name:character.remove(ob);ob.hide_render=True
 button=material('AJ pearl buttons',(.72,.72,.67),.32)
 for z in [1.332,1.305,1.278]:
  bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=(0,-.109,z),scale=(.005,.0025,.005))
  ob=bpy.context.object;ob.name='AJ polo button';bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);bind(ob,button,'Spine2')
 belt=material('AJ warm brown leather',(.045,.025,.016),.48)
 buckle=material('AJ brushed buckle',(.35,.37,.39),.3,.7)
 verts=[];faces=[];N=96
 for z,rx,ry in [(.8,.18,.115),(.833,.18,.115)]:
  for j in range(N):
   a=2*math.pi*j/N;verts.append((rx*math.cos(a),.025+ry*math.sin(a),z))
 for j in range(N):faces.append((j,(j+1)%N,(j+1)%N+N,j+N))
 mesh('AJ leather belt',verts,faces,belt,'Hips')
 for x in [-.021,.021]:box('AJ buckle side',(x,-.096,.8165),(.005,.007,.032),buckle,'Hips',.002)
 for z in [.802,.831]:box('AJ buckle rim',(0,-.096,z),(.045,.007,.005),buckle,'Hips',.002)
 box('AJ buckle prong',(0,-.101,.8165),(.023,.003,.003),buckle,'Hips',.001)
 trousers=bpy.data.materials['AJ_Trousers']
 for x in [-.12,-.065,.065,.12]:
  y=.025-.117*math.sqrt(1-(x/.183)**2)
  box('AJ belt loop',(x,y-.002,.818),(.011,.005,.043),trousers,'Hips',.002)
 # Sculpt shallow flowing ridges in the existing hair, keeping its head weights.
 hair_indices={i for p in body.data.polygons if p.material_index==3 for i in p.vertices}
 for i in hair_indices:
  v=body.data.vertices[i];x,y,z=v.co
  if z>1.65:
   front=max(0,min(1,(-y+.03)/.18))
   wave=.004*math.sin(65*x+18*z)*front
   v.co.y-=wave;v.co.z+=.012*math.exp(-((x+.055)/.095)**2)*max(0,min(1,(z-1.65)/.12))
 hair=bpy.data.materials['AJ_Hair'].node_tree.nodes.get('Principled BSDF')
 hair.inputs['Base Color'].default_value=(.05,.028,.018,1);hair.inputs['Roughness'].default_value=.5
