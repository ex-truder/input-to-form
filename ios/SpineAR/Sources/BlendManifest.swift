import Foundation

struct BlendManifest: Decodable {
    struct Timeline: Decodable { let duration: Double }
    struct Keyframe: Decodable { let progress: Double; let value: Double }
    struct Blend: Decodable { let easing: String; let keyframes: [Keyframe] }
    struct Track: Decodable { let target: String; let blend: Blend? }
    let timeline: Timeline
    let materials: [Track]

    func amount(for target: String, at progress: Double) -> Float {
        guard let blend = materials.first(where: { $0.target == target })?.blend,
              let first = blend.keyframes.first,
              let last = blend.keyframes.last else { return 0 }
        if progress <= first.progress { return Float(first.value) }
        if progress >= last.progress { return Float(last.value) }
        for (left, right) in zip(blend.keyframes, blend.keyframes.dropFirst()) where progress <= right.progress {
            let span = right.progress - left.progress
            var t = span == 0 ? 1 : (progress - left.progress) / span
            if blend.easing == "smoothstep" { t = t * t * (3 - 2 * t) }
            if blend.easing == "step" { t = 0 }
            return Float(left.value + (right.value - left.value) * t)
        }
        return Float(last.value)
    }
}

struct NativeAssetInfo: Decodable {
    let halfDuration: Double
    let cycleDuration: Double
    let entityMaterials: [String: String]
}
