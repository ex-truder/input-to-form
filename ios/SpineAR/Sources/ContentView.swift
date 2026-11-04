import SwiftUI

@MainActor
final class PlaybackState: ObservableObject {
    @Published var message = "Загружаем модель и материалы…"
    @Published var ready = false
    @Published var placed = false
    @Published var playing = true
    @Published var progress: Double = 0
    @Published var failed = false
    var seekHandler: ((Double) -> Void)?
    var resetHandler: (() -> Void)?

    func seek(_ value: Double) {
        playing = false
        seekHandler?(value)
    }
}

@MainActor
struct ContentView: View {
    @StateObject private var playback = PlaybackState()
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        ARContainer(playback: playback)
            .ignoresSafeArea()
            .overlay(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Позвоночник в AR").font(.headline)
                    Text(playback.message).font(.subheadline)
                    if playback.ready && playback.placed {
                        HStack {
                            Button(playback.playing ? "Пауза" : "Воспроизвести") {
                                playback.playing.toggle()
                            }.buttonStyle(.borderedProminent)
                            Spacer()
                            Text("\(Int(playback.progress * 100))%")
                                .monospacedDigit().accessibilityLabel("Развитие изменений")
                        }
                        Slider(value: Binding(get: { playback.progress }, set: playback.seek), in: 0...1)
                            .accessibilityLabel("Развитие изменений")
                        Button("Разместить заново") { playback.resetHandler?() }
                            .buttonStyle(.bordered)
                    }
                    if playback.failed {
                        Text("Проверьте доступ к камере в настройках приложения. Подробности загрузки доступны в консоли Xcode.")
                            .font(.caption)
                    }
                }
                .padding(20)
                .frame(maxWidth: 520, alignment: .leading)
                .background(Color(red: 0.96, green: 0.94, blue: 0.90), in: RoundedRectangle(cornerRadius: 16))
                .padding()
            }
            .tint(Color(red: 0.65, green: 0.19, blue: 0.03))
            .preferredColorScheme(.light)
            .onChange(of: scenePhase) { _, phase in
                if phase != .active && playback.placed { playback.playing = false }
            }
    }
}
