"""Bake source detail plus restrained fabric variation into portable PBR maps."""
import bpy

def refine_surfaces(body, out):
    source=body.data.materials[0]
    diffuse=next(n.image for n in source.node_tree.nodes if n.type=='TEX_IMAGE' and any(l.to_socket.name=='Base Color' for l in n.outputs['Color'].links))
    normal=next(n.image for n in source.node_tree.nodes if n.type=='TEX_IMAGE' and any(l.to_socket.name=='Color' for l in n.outputs['Color'].links))
    normal.colorspace_settings.name='Non-Color'
    for mat in body.data.materials:
        nodes=mat.node_tree.nodes;links=mat.node_tree.links;p=nodes.get('Principled BSDF')
        # Remove imported glossy/specular connections that wash out the atlas.
        for link in list(p.inputs['Specular IOR Level'].links): links.remove(link)
        p.inputs['Specular IOR Level'].default_value=.25
        tex=nodes.new('ShaderNodeTexImage');tex.image=normal
        nm=nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.55
        links.new(tex.outputs['Color'],nm.inputs['Color']);links.new(nm.outputs['Normal'],p.inputs['Normal'])
        noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=180;noise.inputs['Detail'].default_value=2
        ramp=nodes.new('ShaderNodeValToRGB')
        if any(w in mat.name for w in ['ink knit','charcoal']):
            base=tuple(p.inputs['Base Color'].default_value)
            ramp.color_ramp.elements[0].color=tuple(c*.72 for c in base[:3])+(1,)
            ramp.color_ramp.elements[1].color=tuple(c*1.12 for c in base[:3])+(1,)
            links.new(noise.outputs['Fac'],ramp.inputs['Fac']);links.new(ramp.outputs['Color'],p.inputs['Base Color'])
            bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=.00035
            links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(nm.outputs['Normal'],bump.inputs['Normal']);links.new(bump.outputs['Normal'],p.inputs['Normal'])
            p.inputs['Roughness'].default_value=.9
        elif 'warm hands' in mat.name:
            t=nodes.new('ShaderNodeTexImage');t.image=diffuse;links.new(t.outputs['Color'],p.inputs['Base Color'])
            p.inputs['Roughness'].default_value=.72
        elif 'soft brown hair' in mat.name:
            t=nodes.new('ShaderNodeTexImage');t.image=diffuse
            mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MIX';mix.inputs[0].default_value=.55;mix.inputs[2].default_value=(.027,.012,.007,1)
            links.new(t.outputs['Color'],mix.inputs[1]);links.new(mix.outputs[0],p.inputs['Base Color'])
            p.inputs['Roughness'].default_value=.76
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=8
    bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
    targets=[]
    for mat in body.data.materials:
        n=mat.node_tree.nodes.new('ShaderNodeTexImage');targets.append((mat,n))
    maps={}
    for kind in ['DIFFUSE','NORMAL','ROUGHNESS']:
        img=bpy.data.images.new('AJ • '+kind.lower(),width=2048,height=2048,alpha=False)
        if kind!='DIFFUSE':img.colorspace_settings.name='Non-Color'
        for mat,n in targets:
            n.image=img;mat.node_tree.nodes.active=n;n.select=True
        scene.render.bake.use_pass_direct=False;scene.render.bake.use_pass_indirect=False;scene.render.bake.use_pass_color=True;scene.render.bake.margin=12
        bpy.ops.object.bake(type=kind)
        img.filepath_raw=str(out/('aj-'+kind.lower()+'.png'));img.file_format='PNG';img.save();img.pack();maps[kind]=img
    # The runtime receives the same detail as the Blender preview.
    for mat in body.data.materials:
        nodes=mat.node_tree.nodes;links=mat.node_tree.links;p=nodes.get('Principled BSDF')
        for kind,socket in [('DIFFUSE','Base Color'),('ROUGHNESS','Roughness')]:
            t=nodes.new('ShaderNodeTexImage');t.image=maps[kind];links.new(t.outputs['Color'],p.inputs[socket])
        t=nodes.new('ShaderNodeTexImage');t.image=maps['NORMAL'];n=nodes.new('ShaderNodeNormalMap');links.new(t.outputs['Color'],n.inputs['Color']);links.new(n.outputs['Normal'],p.inputs['Normal'])
    return maps
