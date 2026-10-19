import SwiftUI

@main
public struct KaideApp: App {
    public init() {}

    public var body: some Scene {
        WindowGroup {
            KaideMainView()
                .preferredColorScheme(.dark)
        }
    }
}
