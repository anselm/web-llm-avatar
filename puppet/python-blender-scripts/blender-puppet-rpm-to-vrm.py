## Stuff extra shape keys or morph targets or whatever we call them into vrms in blender - this file gets run from inside blender scripting
# Tip: It"s very easy to extend blender since any button click action you do is logged as the equivalent python command to the python console.

print("Copying expressions from avatar to VRM 1.0 - make sure you have the blender vrm plugin installed and an avatar loaded from RPM or CC4")

import bpy
import pprint
import time

#
# note that the remapping below has the same keys as this...
#

expressions_arkit_oculus = [
    "viseme_sil", "viseme_PP", "viseme_FF", "viseme_TH", "viseme_DD", "viseme_kk", "viseme_CH", "viseme_SS", "viseme_nn",
    "viseme_RR", "viseme_aa", "viseme_E", "viseme_I", "viseme_O", "viseme_U",
    "eyeBlinkLeft", "eyeLookDownLeft", "eyeLookInLeft", "eyeLookOutLeft", "eyeLookUpLeft", "eyeSquintLeft", "eyeWideLeft",
    "eyeBlinkRight", "eyeLookDownRight", "eyeLookInRight", "eyeLookOutRight", "eyeLookUpRight", "eyeSquintRight", "eyeWideRight",
    "eyesClosed", "eyesLookUp", "eyesLookDown",
    "jawForward", "jawLeft", "jawRight", "jawOpen",
    "browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight",
    "cheekPuff", "cheekSquintLeft", "cheekSquintRight",
    "noseSneerLeft", "noseSneerRight", "tongueOut",
    "mouthClose", "mouthFunnel", "mouthPucker", "mouthLeft", "mouthRight", "mouthSmileLeft", "mouthSmileRight", "mouthFrownLeft", "mouthFrownRight",
    "mouthDimpleLeft", "mouthDimpleRight", "mouthStretchLeft", "mouthStretchRight",
    "mouthRollLower", "mouthRollUpper", "mouthShrugLower", "mouthShrugUpper",
    "mouthPressLeft", "mouthPressRight", "mouthLowerDownLeft", "mouthLowerDownRight", "mouthUpperUpLeft", "mouthUpperUpRight",
    "mouthOpen", "mouthSmile",
]

#
# for cc4 and some other datasets we will use this to set vrm 1.0 fields
# we want to create the left side things from the right side hints
#
# see also https://github.com/pkhungurn/talking-head-anime-3-demo/blob/main/tha3/mocap/ifacialmocap_constants.py
#

expressions_remap_cc4_to_arkit = {
    "viseme_sil" : None, #"basis",
    "viseme_PP" : "B_M_P",
    "viseme_FF" : "F_V",
    "viseme_TH" : "TH",
    "viseme_DD" : "T_L_D_N",
    "viseme_kk" : "K_G_H_NG",
    "viseme_CH" : "Ch_J",
    "viseme_SS" : "S_Z",
    "viseme_nn" : "T_L_D_N",
    "viseme_RR" : "R",
    "viseme_aa" : "Ah",
    "viseme_E" : "EE",
    "viseme_I" : "IH",
    "viseme_O" : "Oh",
    "viseme_U" : "W_OO",
    # None : "Er",
    # None : "AE",
    # None : "Eyes_Blink",
    "eyeBlinkLeft" : "Eye_Blink_L",
    "eyeLookDownLeft" : None,
    "eyeLookInLeft" : None,
    "eyeLookOutLeft" : None,
    "eyeLookUpLeft" : None,
    "eyeSquintLeft" : "Eye_Squint_L",
    "eyeWideLeft" : "Eye_Wide_L",
    "eyeBlinkRight" : "Eye_Blink_R",
    "eyeLookDownRight" : None,
    "eyeLookInRight" : None,
    "eyeLookOutRight" : None,
    "eyeLookUpRight" : None,
    "eyeSquintRight" : "Eye_Squint_R",
    "eyeWideRight" : "Eye_Wide_R",
    "eyesClosed" : [ "Eye_Blink_L", "Eye_Blink_R" ],
    "eyesLookUp" : None,
    "eyesLookDown" : None,
    "jawForward" : None,
    "jawLeft" : None,
    "jawRight" : None,
    "jawOpen" : None,
    "browDownLeft" : "Brow_Drop_Left",
    "browDownRight" : "Brow_Drop_Right",
    "browInnerUp" : [ "Brow_Raise_Inner_Left", "Brow_Raise_Inner_Right" ],
    "browOuterUpLeft" : "Brow_Raise_Outer_Left",
    "browOuterUpRight" : "Brow_Raise_Outer_Right",
    # None : "Brow_Raise_Left",
    # None : "Brow_Raise_Right",
    "cheekPuff" : [ "Cheek_Blow_L", "Cheek_Blow_R" ],
    "cheekSquintLeft" : "Cheek_Raise_L",
    "cheekSquintRight" : "Cheek_Raise_R",
    # None : "Cheeks_Suck",
    "noseSneerLeft" : "Nose_Flank_Raise_L",
    "noseSneerRight" : "Nose_Flank_Raise_R",
    # None" : "Nose_Flanks_Raise",
    # None" : "Nose_Nostrils_Flare",
    # None" : "Nose_Scrunch",
    "tongueOut" : None,
    "mouthOpen": "Mouth_Open",
    "mouthSmile": "Mouth_Smile",
    "mouthClose" : None,
    "mouthFunnel" : "Mouth_Pucker_Open",
    "mouthPucker" : "Mouth_Pucker",
    "mouthLeft" : "Mouth_L",
    "mouthRight" : "Mouth_R",
    "mouthSmileLeft" : "Mouth_Smile_L",
    "mouthSmileRight" : "Mouth_Smile_R",
    "mouthFrownLeft" : "Mouth_Frown_L",
    "mouthFrownRight" : "Mouth_Frown_R",
    "mouthDimpleLeft" : "Mouth_Dimple_L",
    "mouthDimpleRight" : "Mouth_Dimple_R",
    "mouthStretchLeft" : "Mouth_L",
    "mouthStretchRight" : "Mouth_R",
    "mouthRollLower" : "Mouth_Bottom_Lip_Under",
    "mouthRollUpper" : "Mouth_Top_Lip_Under",
    "mouthShrugLower" : None,
    "mouthShrugUpper" : None,
    "mouthPressLeft" : None,
    "mouthPressRight" : None,
    "mouthLowerDownLeft": "Mouth_Frown_L",
    "mouthLowerDownRight": "Mouth_Frown_R",
    "mouthUpperUpLeft": "Mouth_Smile_L",
    "mouthUpperUpRight": "Mouth_Smile_R",
    # None : Mouth_Frown
    # None : Mouth_Blow
    # None : Mouth_Widen
    # None : Mouth_Plosive
    # None : Mouth_Lips_Tight
    # None : Mouth_Lips_Tuck
    # None : Mouth_Lips_Open
    # None : Mouth_Lips_Part
    # None : Mouth_Bottom_Lip_Down
    # None : Mouth_Top_Lip_Up
    # None : Mouth_Snarl_Upper_L
    # None : Mouth_Snarl_Upper_R
    # None : Mouth_Snarl_Lower_L
    # None : Mouth_Snarl_Lower_R
    # None : Mouth_Bottom_Lip_Bite
    # None : Mouth_Down
    # None : Mouth_Up
    # None : Mouth_Lips_Jaw_Adjust
    # None : Mouth_Bottom_Lip_Trans
    # None : Mouth_Skewer
}


#
# find parts
#

armature = bpy.data.objects["Armature"]
iscc4 = bpy.data.objects.get("CC_Base_Body")
isrpm = bpy.data.objects.get("Wolf3D_Head")
parts = []
part_names = [
    # "CC_Base_Eye", ... appear to be no shape keys here
    "CC_Base_Teeth",
    "CC_Base_Tongue",
    "CC_Base_Body",
    "Wolf3D_Head",
    ]

for name in part_names:
    found = bpy.data.objects.get(name)
    if found:
        print("Building a parts list to write expressions to",name)
        parts.append(found)

if armature is None:
    raise ValueError("Avatar must have an armature")

if iscc4 is None and isrpm is None:
    raise ValueError("Avatar is neither CC4 nor RPM")

#
# Sanitize
#

def sanitize():
    for index, expression in enumerate(expressions_arkit_oculus):
        bpy.ops.vrm.remove_vrm1_expressions_custom_expression(armature_name="Armature", custom_expression_name=expression)

#
# For RPM we expect to see the expressions_arkit_oculus morph targets
#

def expressions_rpm():
    if isrpm is not None:
        for index, expression in enumerate(expressions_arkit_oculus):
            bpy.ops.vrm.remove_vrm1_expressions_custom_expression(armature_name="Armature", custom_expression_name=expression)
            bpy.ops.vrm.add_vrm1_expressions_custom_expression(armature_name="Armature", custom_expression_name=expression)
            bpy.ops.vrm.add_vrm1_expression_morph_target_bind(armature_name="Armature", expression_name=expression)
            custom = bpy.data.armatures["Armature"].vrm_addon_extension.vrm1.expressions.custom[index]
            custom = custom.custom_name=expression
            for index2, part in enumerate(parts):
                print("binding",expression,index2)
                custom.morph_target_binds[index2].node.bpy_object = part
                custom.morph_target_binds[index2].index = expression

#
# For CC4 we start with the arkit_oculus name and look up the CC4 name
#

def expressions_cc4():
    if iscc4 is not None:
        for (expression,shapes) in expressions_remap_cc4_to_arkit.items():

            # Add a custom expression
            bpy.ops.vrm.add_vrm1_expressions_custom_expression(armature_name="Armature", custom_expression_name=expression)

            # No mapping from rpm to cc4 - create but leave it unbound
            if shapes is None:
                continue

            # poke it around a bit to exercise it because there seems to be a race condition - try remove this @todo
            # bpy.ops.vrm.move_up_vrm1_expressions_custom_expression(armature_name="Armature", custom_expression_name=expression)
            # bpy.ops.vrm.update_vrm1_expression_ui_list_elements()

            # Get the index to the fresh custom expression
            index = len( armature.data.vrm_addon_extension.vrm1.expressions.custom ) - 1
            print("currently thinking about expression",expression,index)

            # Get a handle on the fresh custom expression
            custom = bpy.data.armatures["Armature"].vrm_addon_extension.vrm1.expressions.custom[index]

            # Go ahead and reinforce the name - it is unclear why here are two separate places the name is stored
            custom.custom_name = expression

            # For targets, for cc4, there may be an array of shape keys to adjust
            if isinstance(shapes, str):
                shapes = [shapes]

            # wire up each cc4 shape key to our rpm named expressions
            for part in parts:

                # if part has no shape keys then ignore
                if not part.data.shape_keys:
                    print("part has no shape keys at all")
                    continue

                # count how many of the expressions exist on the cc4 model source
                count = 0
                for shape in shapes:
                    if part.data.shape_keys.key_blocks.get(shape):
                        count = count + 1

                # if there are no expressions on the source then skip this
                if not count:
                    print("part does not have shapes",shapes[0])
                    continue

                for shape in shapes:

                    print("... currently writing",expression,index,shape)

                    # for this custom expression, create a fresh morph target
                    bpy.ops.vrm.add_vrm1_expression_morph_target_bind(armature_name="Armature", expression_name=expression)

                    # add morph target and shape
                    index = len(custom.morph_target_binds) - 1
                    custom.morph_target_binds[index].node.bpy_object = part
                    custom.morph_target_binds[index].index = shape

sanitize()
expressions_rpm()
expressions_cc4()

