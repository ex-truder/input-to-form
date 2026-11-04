import ARKit
import AVFoundation
import Combine
import Metal
import RealityKit
import SwiftUI

@MainActor
struct ARContainer: UIViewRepresentable {
    @ObservedObject var playback: PlaybackState

    func makeCoordinator() -> Coordinator { Coordinator(playback: playback) }

    func makeUIView(context: Context) -> ARView {
        let view = ARView(frame: .zero, cameraMode: .ar, automaticallyConfigureSession: false)
        context.coordinator.attach(to: view)
        return view
    }

    func updateUIView(_ view: ARView, context: Context) {}

    static func dismantleUIView(_ view: ARView, coordinator: Coordinator) {
        coordinator.shutdown()
        view.session.pause()
    }
}

@MainActor
final class Coordinator: NSObject, ARSessionDelegate {
    struct Binding {
        let entity: Entity
        let index: Int
        let target: String
        var material: CustomMaterial
    }

    private let playback: PlaybackState
    private weak var arView: ARView?
    private var coaching: ARCoachingOverlayView?
    private var requests = Set<AnyCancellable>()
    private var updateSubscription: Cancellable?
    private var setupTask: Task<Void, Never>?
    private var root: Entity?
    private var initialRootTransform: Transform?
    private var anchor: AnchorEntity?
    private var bindings: [Binding] = []
    private var controllers: [AnimationPlaybackController] = []
    private var animationTargets: [(Entity, AnimationResource)] = []
    private var manifest: BlendManifest?
    private var assetInfo: NativeAssetInfo?
    private var elapsed = 0.0
    private var lastUIUpdate = 0.0

    init(playback: PlaybackState) { self.playback = playback; super.init() }

    func attach(to view: ARView) {
        arView = view
        view.session.delegate = self
        view.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(place(_:))))
        let coaching = ARCoachingOverlayView()
        coaching.session = view.session
        coaching.goal = .horizontalPlane
        coaching.activatesAutomatically = true
        coaching.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        coaching.frame = view.bounds
        view.addSubview(coaching)
        self.coaching = coaching
        playback.seekHandler = { [weak self] in self?.seek($0) }
        playback.resetHandler = { [weak self] in self?.resetPlacement() }
        setupTask = Task { [weak self] in
            guard let self else { return }
            guard ARWorldTrackingConfiguration.isSupported else {
                self.fail("Это устройство не поддерживает ARKit."); return
            }
            let allowed = await AVCaptureDevice.requestAccess(for: .video)
            guard !Task.isCancelled else { return }
            guard allowed else { self.fail("Нет доступа к камере."); return }
            let configuration = ARWorldTrackingConfiguration()
            configuration.planeDetection = [.horizontal]
            configuration.isLightEstimationEnabled = true
            view.session.run(configuration)
            self.loadAssets()
        }
    }

    private func assetURL(_ name: String, _ ext: String) throws -> URL {
        guard let url = Bundle.main.url(forResource: name, withExtension: ext) else {
            throw NSError(domain: "SpineAR", code: 1, userInfo: [NSLocalizedDescriptionKey: "Отсутствует ресурс \(name).\(ext)"])
        }
        return url
    }

    private func loadAssets() {
        do {
            manifest = try JSONDecoder().decode(BlendManifest.self, from: Data(contentsOf: assetURL("BlendManifest", "json")))
            assetInfo = try JSONDecoder().decode(NativeAssetInfo.self, from: Data(contentsOf: assetURL("NativeAssetInfo", "json")))
            let model = Entity.loadAsync(contentsOf: try assetURL("Spine", "usdz"))
            let options = TextureResource.CreateOptions(semantic: .raw)
            let bone = TextureResource.loadAsync(contentsOf: try assetURL("lumbar_bone_atlas", "png"), options: options)
            let disk = TextureResource.loadAsync(contentsOf: try assetURL("lumbar_disk_atlas", "png"), options: options)
            model.zip(bone.zip(disk)).receive(on: DispatchQueue.main)
                .sink(receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion { self?.fail(error.localizedDescription) }
                }, receiveValue: { [weak self] entity, textures in
                    guard let self else { return }
                    do { try self.prepare(entity, bone: textures.0, disk: textures.1) }
                    catch { self.fail(error.localizedDescription) }
                }).store(in: &requests)
        } catch { fail(error.localizedDescription) }
    }

    private func classify(_ material: any Material, entity: Entity) -> String? {
        for target in ["lumbar_bone", "lumbar_disk"] {
            if material.name?.contains(target) == true { return target }
        }
        var candidate: Entity? = entity
        while let current = candidate {
            if let target = assetInfo?.entityMaterials[current.name], target != "disk_internals" { return target }
            candidate = current.parent
        }
        return nil
    }

    private func prepare(_ entity: Entity, bone: TextureResource, disk: TextureResource) throws {
        guard let view = arView, let device = MTLCreateSystemDefaultDevice(), let library = device.makeDefaultLibrary() else {
            throw NSError(domain: "SpineAR", code: 2, userInfo: [NSLocalizedDescriptionKey: "Не удалось загрузить Metal-шейдер."])
        }
        let shader = CustomMaterial.SurfaceShader(named: "spineTextureBlend", in: library)
        var found = Set<String>()
        func visit(_ current: Entity) throws {
            if var model = current.components[ModelComponent.self] {
                for index in model.materials.indices {
                    guard let target = classify(model.materials[index], entity: current) else { continue }
                    var material = try CustomMaterial(from: model.materials[index], surfaceShader: shader)
                    material.custom.texture = .init(target == "lumbar_bone" ? bone : disk)
                    material.custom.value = .zero
                    model.materials[index] = material
                    bindings.append(Binding(entity: current, index: index, target: target, material: material))
                    found.insert(target)
                }
                current.components[ModelComponent.self] = model
            }
            for child in current.children { try visit(child) }
        }
        try visit(entity)
        guard found == Set(["lumbar_bone", "lumbar_disk"]) else {
            throw NSError(domain: "SpineAR", code: 3, userInfo: [NSLocalizedDescriptionKey: "Не удалось сопоставить материалы модели: \(found.sorted())."])
        }
        root = entity
        initialRootTransform = entity.transform
        // Some USD importers expose a combined animation at the root, others
        // expose per-part animations. Do not play only the first resource.
        func collectAnimations(_ current: Entity) {
            if !current.availableAnimations.isEmpty {
                animationTargets += current.availableAnimations.map { (current, $0) }
            } else {
                for child in current.children { collectAnimations(child) }
            }
        }
        collectAnimations(entity)
        guard !animationTargets.isEmpty else {
            throw NSError(domain: "SpineAR", code: 4, userInfo: [NSLocalizedDescriptionKey: "В модели не найдена анимация деформации."])
        }
        print("SpineAR ready:", bindings.count, "material bindings;", animationTargets.count, "animation resources")
        applyFrame()
        updateSubscription = view.scene.subscribe(to: SceneEvents.Update.self) { [weak self] event in
            let delta = event.deltaTime
            Task { @MainActor [weak self] in self?.update(delta: delta) }
        }
        playback.ready = true
        playback.message = "Найдите поверхность и коснитесь её, чтобы разместить модель."
    }

    private func update(delta: TimeInterval) {
        guard playback.placed, playback.playing, let info = assetInfo else { return }
        elapsed = (elapsed + min(delta, 0.1)).truncatingRemainder(dividingBy: info.cycleDuration)
        applyFrame()
    }

    private func applyFrame() {
        guard let info = assetInfo, let manifest else { return }
        let phase = max(0, min(1, elapsed <= info.halfDuration ? elapsed / info.halfDuration : (info.cycleDuration - elapsed) / info.halfDuration))
        for controller in controllers { controller.time = elapsed }
        for index in bindings.indices {
            bindings[index].material.custom.value.x = manifest.amount(for: bindings[index].target, at: phase)
            guard var component = bindings[index].entity.components[ModelComponent.self] else { continue }
            component.materials[bindings[index].index] = bindings[index].material
            bindings[index].entity.components[ModelComponent.self] = component
        }
        let now = Date.timeIntervalSinceReferenceDate
        if now - lastUIUpdate > 0.05 || !playback.playing {
            playback.progress = phase
            lastUIUpdate = now
        }
    }

    private func seek(_ value: Double) {
        guard let info = assetInfo else { return }
        elapsed = max(0, min(1, value)) * info.halfDuration
        applyFrame()
    }

    @objc private func place(_ gesture: UITapGestureRecognizer) {
        guard playback.ready, !playback.placed, let view = arView, let root,
              let result = view.raycast(from: gesture.location(in: view), allowing: .estimatedPlane, alignment: .horizontal).first else { return }
        let handle = ModelEntity()
        if let initialRootTransform { root.transform = initialRootTransform }
        handle.addChild(root)
        let bounds = root.visualBounds(relativeTo: root)
        // Rest the model's lowest point on the hit surface.
        root.position.y -= bounds.min.y
        let adjusted = root.visualBounds(relativeTo: handle)
        handle.collision = CollisionComponent(shapes: [.generateBox(size: adjusted.extents).offsetBy(translation: adjusted.center)])
        let anchor = AnchorEntity(world: result.worldTransform)
        anchor.addChild(handle)
        view.scene.addAnchor(anchor)
        controllers = animationTargets.map { owner, resource in
            owner.playAnimation(resource.repeat(), transitionDuration: 0, startsPaused: true)
        }
        applyFrame()
        view.installGestures([.rotation, .scale], for: handle)
        self.anchor = anchor
        coaching?.setActive(false, animated: true)
        playback.placed = true
        playback.message = "Форма и текстуры меняются по общей шкале. Двумя пальцами можно менять масштаб и поворот."
    }

    private func resetPlacement() {
        controllers.forEach { $0.stop() }
        controllers = []
        elapsed = 0
        root?.removeFromParent()
        anchor?.removeFromParent()
        anchor = nil
        playback.placed = false
        playback.progress = 0
        coaching?.setActive(true, animated: true)
        playback.message = "Коснитесь поверхности, чтобы разместить модель заново."
    }

    private func fail(_ message: String) {
        print("SpineAR error:", message)
        playback.failed = true
        playback.ready = false
        playback.message = message
    }

    nonisolated func session(_ session: ARSession, didFailWithError error: Error) {
        let message = error.localizedDescription
        Task { @MainActor [weak self] in self?.fail(message) }
    }

    nonisolated func sessionWasInterrupted(_ session: ARSession) {
        Task { @MainActor [weak self] in
            self?.playback.playing = false
            self?.playback.message = "AR-сессия прервана. После возврата проверьте положение модели."
        }
    }

    func shutdown() {
        setupTask?.cancel()
        requests.removeAll()
        updateSubscription?.cancel()
        controllers.forEach { $0.stop() }
        playback.seekHandler = nil
        playback.resetHandler = nil
    }
}
