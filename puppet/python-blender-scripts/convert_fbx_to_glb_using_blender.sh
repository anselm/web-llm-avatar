#!/bin/bash

# Check if the correct number of arguments are provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 path_to_fbx_file"
    exit 1
fi

# Path to the FBX file
FBX_FILE_PATH="$1"

# Check if the file exists
if [ ! -f "$FBX_FILE_PATH" ]; then
    echo "File not found: $FBX_FILE_PATH"
    exit 1
fi

# Path to the Blender Python script
PYTHON_SCRIPT_PATH="$(dirname "$0")/convert_fbx_to_glb_using_blender.py"

# Run Blender with the Python script and the FBX file path
/Applications/Blender41.app/Contents/MacOS/blender --background --python "$PYTHON_SCRIPT_PATH" -- "$FBX_FILE_PATH"


