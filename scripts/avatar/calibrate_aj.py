"""Anatomical neutral for AJ; invoked by build_aj.py before export."""
from mathutils import Matrix, Vector

def calibrate(rig):
    for b in rig.pose.bones:
        b.rotation_mode='QUATERNION'; b.rotation_quaternion=(1,0,0,0)
    bpy.context.view_layer.update()
    def orient(name, direction, normal):
        b=rig.pose.bones[name]
        y=Vector(direction).normalized(); x=y.cross(Vector(normal)).normalized(); z=x.cross(y).normalized()
        m=Matrix((x,y,z)).transposed().to_4x4(); m.translation=b.head
        b.matrix=m; bpy.context.view_layer.update()
    poses={}
    for side,sign in [('Right',-1),('Left',1)]:
        shoulder=rig.pose.bones[side+'Arm'].head.copy()
        fore=rig.pose.bones[side+'ForeArm'].head.copy()
        wrist=rig.pose.bones[side+'Hand'].head.copy()
        l1=(fore-shoulder).length;l2=(wrist-fore).length
        target=Vector((sign*0.29,-0.27,1.34))
        axis=target-shoulder; d=axis.length; axis.normalize()
        pole=Vector((sign*0.7,0,-0.8)); pole=(pole-axis*pole.dot(axis)).normalized()
        along=(l1*l1-l2*l2+d*d)/(2*d)
        elbow=shoulder+axis*along+pole*max(0,l1*l1-along*along)**0.5
        orient(side+'Arm',elbow-shoulder,(0,-1,0))
        orient(side+'ForeArm',target-elbow,(0,-1,0))
        orient(side+'Hand',(sign*0.08,0,1),(0,-1,0))
        for suffix in ['Arm','ForeArm','Hand']:
            b=rig.pose.bones[side+suffix];q=b.rotation_quaternion.copy()
            poses[side+suffix]=[q.x,q.y,q.z,q.w]
            rig.data.bones[side+suffix]['signingNeutral']=poses[side+suffix]
    return poses
