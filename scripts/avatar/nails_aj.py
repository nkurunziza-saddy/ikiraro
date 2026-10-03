"""Small skinned nail plates fitted to the original distal phalanges."""
import bpy
from mathutils.bvhtree import BVHTree

def add_nails(body, rig):
    tree=BVHTree.FromPolygons([v.co for v in body.data.vertices],[list(p.vertices) for p in body.data.polygons])
    mat=bpy.data.materials.new('AJ • natural nails');mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value=(.66,.44,.34,1)
    bsdf.inputs['Roughness'].default_value=.48
    nails=[]
    for side in ['Right','Left']:
        for finger in ['Thumb','Index','Middle','Ring','Pinky']:
            b=rig.data.bones[side+'Hand'+finger+'3'];m=b.matrix_local
            y=m.to_3x3().col[1];z=m.to_3x3().col[2]
            center=b.head_local+y*b.length*.58
            origin=body.matrix_world.inverted()@rig.matrix_world@(center-z*.035)
            direction=(body.matrix_world.inverted().to_3x3()@rig.matrix_world.to_3x3()@z).normalized()
            hit,normal,_,_=tree.ray_cast(origin,direction,.06)
            if hit is None:continue
            location=body.matrix_world@hit
            bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,location=location)
            o=bpy.context.object;o.name='AJ • '+side+' '+finger+' nail'
            o.rotation_euler=(rig.matrix_world.to_quaternion()@m.to_quaternion()).to_euler()
            o.scale=(.005 if finger!='Pinky' else .0038,min(.008,b.length*.3),.0005)
            bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
            o.data.materials.append(mat)
            for p in o.data.polygons:p.use_smooth=True
            o.vertex_groups.new(name=b.name).add(list(range(len(o.data.vertices))),1,'REPLACE')
            mod=o.modifiers.new('AJ • nail skin','ARMATURE');mod.object=rig
            o.parent=rig;o.matrix_parent_inverse=rig.matrix_world.inverted()
            nails.append(o)
    if not nails:return []
    bpy.ops.object.select_all(action='DESELECT')
    for o in nails:o.select_set(True)
    bpy.context.view_layer.objects.active=nails[0];bpy.ops.object.join()
    nails[0].name='AJ • nail plates'
    return [nails[0]]
