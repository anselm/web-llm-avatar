import bpy
import sys

# Clear the existing scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Path to the FBX file
fbx_file_path = sys.argv[sys.argv.index('--') + 1]

# Import the FBX file
bpy.ops.import_scene.fbx(filepath=fbx_file_path)

# Path to save the GLB file
glb_file_path = fbx_file_path.replace('.fbx', '.glb')

# Export as GLB
bpy.ops.export_scene.gltf(filepath=glb_file_path, export_format='GLB', export_skins=False)

print(f"FBX file '{fbx_file_path}' has been converted to GLB and saved as '{glb_file_path}'")


