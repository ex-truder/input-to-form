#include <metal_stdlib>
#include <RealityKit/RealityKit.h>
using namespace metal;

// Atlas is raw data: two original 2K albedo maps, two original 2K ORM
// maps, and two original 1K normal maps. No texture-frame sequence is used.
constexpr sampler atlasSampler(coord::normalized, address::clamp_to_edge,
                               filter::linear, mip_filter::none);

static float2 atlasUV(float2 uv, uint kind, uint state) {
    float side = kind == 2 ? 1024.0 : 2048.0;
    float2 origin = kind == 2 ? float2(state * 1024.0, 4096.0)
                             : float2(state * 2048.0, kind * 2048.0);
    return (origin + 0.5 + uv * (side - 1.0)) / float2(4096.0, 5120.0);
}

static float3 srgbToLinear(float3 value) {
    return select(pow((value + 0.055) / 1.055, float3(2.4)),
                  value / 12.92, value <= 0.04045);
}

[[visible]]
void spineTextureBlend(realitykit::surface_parameters params) {
    float2 uv = params.geometry().uv0();
    uv.y = 1.0 - uv.y; // RealityKit's USDZ UV convention.
    uv = fract(uv);
    float blend = clamp(params.uniforms().custom_parameter().x, 0.0, 1.0);
    auto atlas = params.textures().custom();
    float3 colorFrom = float3(atlas.sample(atlasSampler, atlasUV(uv, 0, 0)).rgb);
    float3 colorTo = float3(atlas.sample(atlasSampler, atlasUV(uv, 0, 1)).rgb);
    float3 ormFrom = float3(atlas.sample(atlasSampler, atlasUV(uv, 1, 0)).rgb);
    float3 ormTo = float3(atlas.sample(atlasSampler, atlasUV(uv, 1, 1)).rgb);
    float3 normalFrom = float3(atlas.sample(atlasSampler, atlasUV(uv, 2, 0)).rgb) * 2.0 - 1.0;
    float3 normalTo = float3(atlas.sample(atlasSampler, atlasUV(uv, 2, 1)).rgb) * 2.0 - 1.0;
    float3 orm = mix(ormFrom, ormTo, blend);
    auto surface = params.surface();
    surface.set_base_color(half3(mix(srgbToLinear(colorFrom), srgbToLinear(colorTo), blend)));
    surface.set_normal(half3(normalize(mix(normalFrom, normalTo, blend))));
    surface.set_ambient_occlusion(half(orm.r));
    surface.set_roughness(half(orm.g));
    // Both source materials explicitly have metalnessFactor=0.
    surface.set_metallic(0.0h);
    surface.set_opacity(1.0h);
}
