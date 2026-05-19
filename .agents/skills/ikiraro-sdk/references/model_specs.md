# Ikiraro Avatar Model Specifications

To ensure the `AvatarViewer` and `SignModelGLTF` can animate your 3D model correctly, the model must adhere to the following rigging and naming conventions.

## 1. Scene Structure

- The model must be a **SkinnedMesh**.
- It should be in **T-Pose** or **Neutral Pose** by default.
- Up-axis should be **Y**.

## 2. Bone Naming Convention

The Ikiraro engine uses a specific bone hierarchy for hand animations. The following names (or their common aliases) must be present:

| Ikiraro Name         | Standard Alias | Description                           |
| :------------------- | :------------- | :------------------------------------ |
| `wrist`              | `Hand`         | The root bone of the hand.            |
| `thumb_proximal`     | `Thumb0`       | First joint of the thumb.             |
| `thumb_intermediate` | `Thumb1`       | Second joint of the thumb.            |
| `thumb_distal`       | `Thumb2`       | Tip of the thumb.                     |
| `index_proximal`     | `Index1`       | Knuckle of the index finger.          |
| `index_intermediate` | `Index2`       | Middle joint of the index finger.     |
| `index_distal`       | `Index3`       | Tip of the index finger.              |
| `middle_...`         | `Middle1,2,3`  | Same pattern for all other fingers... |
| `ring_...`           | `Ring1,2,3`    |                                       |
| `pinky_...`          | `Pinky1,2,3`   |                                       |

## 3. Rotation Logic

- **Joint Type**: Spherical (Quaternion) rotations are preferred.
- **Orientation**: Fingers should extend along the **X** or **Z** local axis of the bones.
- **Default State**: At rotation `(0,0,0)`, the hand should be open and flat.

## 4. Optimization

- **Polygon Count**: Keep the mesh under 50k triangles for smooth web performance.
- **Materials**: Use `MeshStandardMaterial` for compatibility with React Three Fiber.
- **Texture**: Preferably a single 2K texture atlas to minimize draw calls.

## 5. Testing Your Model

You can test a custom model by passing its URL to the `AvatarViewer`:

```tsx
<AvatarViewer modelUrl="https://your-server.com/my-custom-avatar.glb" />
```

If the fingers "crunch" or rotate incorrectly, check the bone local axes in your 3D software (Blender/Maya).
